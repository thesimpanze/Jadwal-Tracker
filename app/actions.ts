'use server'

import { supabase } from '@/utils/supabase'
import { revalidatePath } from 'next/cache'

export async function addSchedule(formData: FormData) {
  const dateStr = formData.get('scheduled_at') as string
  const timeStr = formData.get('jam_mulai') as string
  
  // Create a combined ISO string for scheduled_at
  const scheduled_at = new Date(`${dateStr}T${timeStr}:00`).toISOString()

  const data = {
    title: formData.get('title') as string,
    name_student: formData.get('name_student') as string,
    name_parent: formData.get('name_parent') as string,
    alamat: formData.get('alamat') as string,
    jam_mulai: formData.get('jam_mulai') as string,
    jam_selesai: formData.get('jam_selesai') as string,
    mapel: formData.get('mapel') as string,
    durasi: parseFloat(formData.get('durasi') as string),
    eksklusif_request: formData.get('eksklusif_request') as string || null,
    description: formData.get('description') as string || null,
    scheduled_at: scheduled_at,
  }

  const { error } = await supabase.from('schedules').insert([data])

  if (error) {
    console.error('Error inserting schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function toggleScheduleComplete(id: string, currentStatus: boolean) {
  const { error } = await supabase
    .from('schedules')
    .update({ is_completed: !currentStatus })
    .eq('id', id)

  if (error) {
    console.error('Error toggling schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting schedule:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
