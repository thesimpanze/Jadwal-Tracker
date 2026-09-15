import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 1. Basic security check (Optional: using a secret token in headers or query params)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Find schedules for today 
  const now = new Date()
  // JavaScript's getDay() returns 0 for Sunday, 1 for Monday.
  // Our schema expects 1 for Senin, ..., 7 for Minggu.
  let currentDayOfWeek = now.getDay()
  if (currentDayOfWeek === 0) currentDayOfWeek = 7 // Adjust Sunday to 7

  // We want to fetch schedules that happen today
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('day_of_week', currentDayOfWeek)

  if (error) {
    console.error('Error fetching schedules for cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No schedules today' }, { status: 200 })
  }

  const fonnteToken = process.env.FONNTE_API_TOKEN
  const targetNumber = process.env.TARGET_WA_NUMBER

  if (!fonnteToken || !targetNumber) {
    console.error('Fonnte token or Target WA Number is missing in env')
    return NextResponse.json({ error: 'Missing Fonnte configuration' }, { status: 500 })
  }

  let notifiedCount = 0

  // Format today's date at midnight to compare with last_notified_at
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 3. Send WhatsApp for schedules coming up in the next 2 hours
  for (const schedule of schedules) {
    // Check if we already notified today
    if (schedule.last_notified_at) {
      const lastNotified = new Date(schedule.last_notified_at)
      if (lastNotified >= todayMidnight) {
        continue // Already notified today
      }
    }

    // Check if it's coming up in the next 2 hours
    const [hours, minutes] = schedule.jam_mulai.split(':').map(Number)
    const scheduleTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    const diffHours = (scheduleTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Notify if the schedule is in the future but less than 2.5 hours away
    if (diffHours >= 0 && diffHours <= 2.5) {
      const message = `*Hai Sayang! Jangan lupa jadwal ngajarmu hari ini ya ❤️*\n\n`
        + `📚 *Mapel*: ${schedule.mapel}\n`
        + `👤 *Murid*: ${schedule.name_student} (${schedule.name_parent})\n`
        + `⏰ *Waktu*: ${schedule.jam_mulai.substring(0, 5)} - ${schedule.jam_selesai.substring(0, 5)} (${schedule.durasi} jam)\n`
        + `📍 *Alamat*: ${schedule.alamat}\n`
        + (schedule.eksklusif_request ? `💡 *Spesial Request*: ${schedule.eksklusif_request}\n` : '')
        + (schedule.description ? `📝 *Catatan*: ${schedule.description}\n` : '')
        + `\nSemangat ngajarnya sayang, I love you! 🥰`

      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: targetNumber,
            message: message,
            delay: '2',
          })
        })

        const result = await response.json()
        if (result.status) {
          // 4. Mark as notified in Supabase for today
          await supabase
            .from('schedules')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', schedule.id)
            
          notifiedCount++
        } else {
          console.error('Fonnte API error:', result)
        }
      } catch (err) {
        console.error('Error calling Fonnte:', err)
      }
    }
  }

  return NextResponse.json({ 
    message: `Processed ${schedules.length} schedules today. Successfully notified ${notifiedCount}.` 
  }, { status: 200 })
}
