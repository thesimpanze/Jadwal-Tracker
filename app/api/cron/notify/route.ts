import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

const TIME_ZONE = 'Asia/Jakarta'

function getJakartaNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  )

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    dayOfWeek: weekdayMap[values.weekday],
    minutesSinceMidnight:
      Number(values.hour) * 60 +
      Number(values.minute) +
      Number(values.second) / 60,
  }
}

function getJakartaDateKey(date: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export async function GET(request: Request) {
  // 1. Basic security check
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Always use WIB (Asia/Jakarta), regardless of the server timezone.
  const jakartaNow = getJakartaNow()
  const currentDayOfWeek = jakartaNow.dayOfWeek

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('day_of_week', currentDayOfWeek)

  if (error) {
    console.error('Error fetching schedules for cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({
      message: 'No schedules today',
      timezone: TIME_ZONE,
      currentTimeWIB: `${jakartaNow.dateKey} ${String(Math.floor(jakartaNow.minutesSinceMidnight / 60)).padStart(2, '0')}:${String(Math.floor(jakartaNow.minutesSinceMidnight % 60)).padStart(2, '0')}`,
    }, { status: 200 })
  }

  const fonnteToken = process.env.FONNTE_API_TOKEN
  const targetNumber = process.env.TARGET_WA_NUMBER

  if (!fonnteToken || !targetNumber) {
    console.error('Fonnte token or Target WA Number is missing in env')
    return NextResponse.json({ error: 'Missing Fonnte configuration' }, { status: 500 })
  }

  let notifiedCount = 0

  for (const schedule of schedules) {
    // Check if we already notified on the current WIB date.
    if (schedule.last_notified_at) {
      const lastNotifiedDateWIB = getJakartaDateKey(schedule.last_notified_at)
      if (lastNotifiedDateWIB === jakartaNow.dateKey) {
        continue
      }
    }

    const [hours, minutes] = schedule.jam_mulai.split(':').map(Number)
    const scheduleMinutes = hours * 60 + minutes
    const diffMinutes = scheduleMinutes - jakartaNow.minutesSinceMidnight

    // Notify if the schedule is in the future and within 2.5 hours.
    if (diffMinutes >= 0 && diffMinutes <= 150) {
      // Ambil file yang terhubung ke jadwal dan buat link publiknya.
      const { data: scheduleFiles, error: filesError } = await supabase
      .from('schedule_files')
      .select('file_name, file_path')
      .eq('schedule_id', schedule.id)
      .order('created_at', { ascending: true })
      
      if (filesError) {
      console.error('Error fetching schedule files for notification:', filesError)
      }
      
      const fileLinks = (scheduleFiles ?? [])
      .map((file) => {
      const { data } = supabase.storage
      .from('schedule-files')
      .getPublicUrl(file.file_path)
      
      return `📎 *File*: ${file.file_name}\n${data.publicUrl}`
      })
      .join('\n\n')
      
      const message =
      `*Hai Sayang! Jangan lupa jadwal ngajarmu hari ini ya 💖*\n\n` +
      `📚 *Mapel*: ${schedule.mapel}\n` +
      `👤 *Murid*: ${schedule.name_student} (${schedule.name_parent})\n` +
      `⏰ *Waktu*: ${schedule.jam_mulai.substring(0, 5)} - ${schedule.jam_selesai.substring(0, 5)} (${schedule.durasi} jam)\n` +
      `📍 *Alamat*: ${schedule.alamat}\n` +
      (schedule.eksklusif_request
      ? `💡 *Spesial Request*: ${schedule.eksklusif_request}\n`
      : "") +
      (schedule.description
      ? `📝 *Catatan*: ${schedule.description}\n`
      : "") +
      (fileLinks
      ? `\n${fileLinks}\n`
      : "") +
      `\nSemangat ngajarnya sayang, I love you! 🤍`;
      

      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: targetNumber,
            message,
            delay: '2',
          })
        })

        const result = await response.json()

        if (result.status) {
          const { error: updateError } = await supabase
            .from('schedules')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', schedule.id)

          if (updateError) {
            console.error('Error updating last_notified_at:', updateError)
          }

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
    message: `Processed ${schedules.length} schedules today. Successfully notified ${notifiedCount}.`,
    timezone: TIME_ZONE,
    currentDateWIB: jakartaNow.dateKey,
    currentTimeWIB: `${String(Math.floor(jakartaNow.minutesSinceMidnight / 60)).padStart(2, '0')}:${String(Math.floor(jakartaNow.minutesSinceMidnight % 60)).padStart(2, '0')}`,
  }, { status: 200 })
}
