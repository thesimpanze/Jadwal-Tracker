import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 1. Basic security check (Optional: using a secret token in headers or query params)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Find schedules for today that haven't been notified yet and aren't completed
  // Fetch schedules within the next 2 hours
  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('wa_notified', false)
    .eq('is_completed', false)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', twoHoursFromNow.toISOString())

  if (error) {
    console.error('Error fetching schedules for cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No schedules to notify' }, { status: 200 })
  }

  const fonnteToken = process.env.FONNTE_API_TOKEN
  const targetNumber = process.env.TARGET_WA_NUMBER

  if (!fonnteToken || !targetNumber) {
    console.error('Fonnte token or Target WA Number is missing in env')
    return NextResponse.json({ error: 'Missing Fonnte configuration' }, { status: 500 })
  }

  let notifiedCount = 0

  // 3. Send WhatsApp for each schedule
  for (const schedule of schedules) {
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
        // 4. Mark as notified in Supabase
        await supabase
          .from('schedules')
          .update({ wa_notified: true })
          .eq('id', schedule.id)
          
        notifiedCount++
      } else {
        console.error('Fonnte API error:', result)
      }
    } catch (err) {
      console.error('Error calling Fonnte:', err)
    }
  }

  return NextResponse.json({ 
    message: `Processed ${schedules.length} schedules. Successfully notified ${notifiedCount}.` 
  }, { status: 200 })
}
