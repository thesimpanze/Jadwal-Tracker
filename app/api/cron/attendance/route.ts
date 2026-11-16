import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TIME_ZONE = 'Asia/Jakarta'
const GROUP_ID = '120363413451900653@g.us' // magang oke👍, verified through Fonnte.
const MESSAGE = 'ABSEN WOK!'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing CRON_SECRET' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const time = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  // Also guard manual calls and schedulers using the wrong timezone.
  if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(time.weekday) ||
      time.hour !== '16' || time.minute !== '50') {
    return NextResponse.json({ message: 'Outside attendance reminder schedule', timezone: TIME_ZONE })
  }

  const token = process.env.FONNTE_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Missing FONNTE_API_TOKEN' }, { status: 503 })
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: GROUP_ID, message: MESSAGE }),
      signal: AbortSignal.timeout(15_000),
    })
    const result = await response.json()
    if (!response.ok || result.status !== true) {
      return NextResponse.json({ error: 'Fonnte rejected attendance reminder' }, { status: 502 })
    }

    return NextResponse.json({ message: 'Attendance reminder accepted by Fonnte', timezone: TIME_ZONE })
  } catch {
    return NextResponse.json({ error: 'Unable to reach Fonnte' }, { status: 502 })
  }
}
