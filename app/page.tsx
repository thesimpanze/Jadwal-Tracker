import { supabase } from '@/utils/supabase'
import { Schedule } from '@/types'
import ScheduleCard from '@/components/ScheduleCard'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { toggleScheduleComplete } from '@/app/actions'

// We need a Client Component wrapper to handle the toggle action, 
// or we can just pass the Server Action to the Client Component if it's supported.
// Actually, since ScheduleCard is a Client Component, we can pass toggleScheduleComplete as a prop!

export const revalidate = 0 // always fetch fresh data

export default async function Home() {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch schedules:', error)
  }

  const typedSchedules = (schedules || []) as Schedule[]

  // Separate upcoming and completed
  const upcoming = typedSchedules.filter(s => !s.is_completed)
  const completed = typedSchedules.filter(s => s.is_completed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jadwal Les</h1>
            <p className="text-pink-500 font-medium mt-1">Semangat ngajarnya ya sayang! ❤️</p>
          </div>
          <Link href="/add" className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2.5 rounded-full font-medium transition-colors shadow-md shadow-pink-200">
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Jadwal</span>
          </Link>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-pink-100 text-pink-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{upcoming.length}</span>
              Akan Datang
            </h2>
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.map(schedule => (
                  <ScheduleCard 
                    key={schedule.id} 
                    schedule={schedule} 
                    onToggleComplete={toggleScheduleComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500">Belum ada jadwal les mendatang.</p>
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 opacity-80">
                <span className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{completed.length}</span>
                Selesai
              </h2>
              <div className="space-y-4 opacity-70">
                {completed.map(schedule => (
                  <ScheduleCard 
                    key={schedule.id} 
                    schedule={schedule} 
                    onToggleComplete={toggleScheduleComplete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
