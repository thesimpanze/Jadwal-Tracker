import { supabase } from '@/utils/supabase'
import EditScheduleForm from '@/components/EditScheduleForm'
import { notFound } from 'next/navigation'
import { Schedule } from '@/types'

export const revalidate = 0

// In Next.js 15, params is a Promise that needs to be awaited
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !schedule) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <EditScheduleForm schedule={schedule as Schedule} />
    </div>
  )
}
