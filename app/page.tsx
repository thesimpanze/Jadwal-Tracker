import { supabase } from '@/utils/supabase'
import { Schedule } from '@/types'
import ScheduleCard from '@/components/ScheduleCard'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

export const revalidate = 0 // always fetch fresh data

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default async function Home() {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .order('jam_mulai', { ascending: true })

  if (error) {
    console.error('Failed to fetch schedules:', error)
  }

  const typedSchedules = (schedules || []) as Schedule[]

  // Group by day of week (1-7)
  const groupedSchedules = typedSchedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(schedule)
    return acc
  }, {} as Record<number, Schedule[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jadwal Mingguan</h1>
            <p className="text-pink-500 font-medium mt-1">Semangat ngajarnya ya sayang! ❤️</p>
          </div>
          <Link href="/add" className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2.5 rounded-full font-medium transition-colors shadow-md shadow-pink-200">
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Jadwal</span>
          </Link>
        </div>

        <div className="space-y-10">
          {typedSchedules.length > 0 ? (
            DAYS.map((dayName, index) => {
              const dayOfWeek = index + 1
              const daySchedules = groupedSchedules[dayOfWeek]

              if (!daySchedules || daySchedules.length === 0) return null

              return (
                <section key={dayOfWeek}>
                  <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-pink-100 flex items-center justify-between">
                    <span>{dayName}</span>
                    <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-semibold">
                      {daySchedules.length} Sesi
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {daySchedules.map(schedule => (
                      <ScheduleCard 
                        key={schedule.id} 
                        schedule={schedule} 
                      />
                    ))}
                  </div>
                </section>
              )
            })
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-pink-200 shadow-sm">
              <p className="text-gray-500 text-lg">Belum ada jadwal mingguan yang ditambahkan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
