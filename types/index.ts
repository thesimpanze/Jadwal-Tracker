export interface Schedule {
  id: string
  created_at: string
  title: string
  name_student: string
  name_parent: string
  alamat: string
  jam_mulai: string // time string e.g. "14:00:00"
  jam_selesai: string
  mapel: string
  durasi: number
  eksklusif_request?: string | null
  description?: string | null
  day_of_week: number // 1=Senin, 2=Selasa, ..., 7=Minggu
  last_notified_at: string | null
}
