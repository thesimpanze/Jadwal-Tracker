'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addSchedule } from '@/app/actions'
import { Calendar, Clock, MapPin, BookOpen, User, Users, AlignLeft, Info } from 'lucide-react'

export default function AddScheduleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await addSchedule(formData)
    
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-10 pr-4 py-3 bg-white border border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all shadow-sm text-gray-700"
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Jadwal Les Baru</h2>
        <p className="text-pink-500 font-medium">Tambahkan jadwal untuk diingatkan nanti.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelClasses}>Judul Sesi (opsional / otomatis)</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input name="title" type="text" placeholder="Misal: Les Matematika SD" required className={inputClasses} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Mata Pelajaran</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="mapel" type="text" placeholder="Matematika" required className={inputClasses} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Durasi (Jam)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="durasi" type="number" step="0.5" placeholder="1.5" required className={inputClasses} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Nama Murid</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="name_student" type="text" placeholder="Budi" required className={inputClasses} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Nama Orang Tua</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="name_parent" type="text" placeholder="Pak Andi" required className={inputClasses} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Alamat</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input name="alamat" type="text" placeholder="Jl. Sudirman No. 123" required className={inputClasses} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Hari</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select name="day_of_week" required className={`${inputClasses} appearance-none`}>
                <option value="1">Senin</option>
                <option value="2">Selasa</option>
                <option value="3">Rabu</option>
                <option value="4">Kamis</option>
                <option value="5">Jumat</option>
                <option value="6">Sabtu</option>
                <option value="7">Minggu</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Jam Mulai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="jam_mulai" type="time" required className={inputClasses} />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Jam Selesai</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="jam_selesai" type="time" required className={inputClasses} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Request Eksklusif</label>
          <div className="relative">
            <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input name="eksklusif_request" type="text" placeholder="Misal: Fokus persiapan ujian" className={inputClasses} />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Catatan Tambahan (opsional)</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
            <textarea name="description" rows={3} placeholder="Materi halaman 10-15" className="w-full pl-10 pr-4 py-3 bg-white border border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all shadow-sm text-gray-700 resize-none"></textarea>
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors w-1/3"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-pink-200 w-2/3 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </div>
    </form>
  )
}
