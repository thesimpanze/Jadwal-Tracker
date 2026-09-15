'use client'

import { Schedule } from '@/types'
import { MapPin, Clock, BookOpen, User } from 'lucide-react'

interface Props {
  schedule: Schedule
}

export default function ScheduleCard({ schedule }: Props) {
  return (
    <div className="relative p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:shadow-xl bg-white/80 border-pink-100 shadow-sm hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900">
            {schedule.title}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-400" />
          <span>{schedule.jam_mulai.substring(0, 5)} - {schedule.jam_selesai.substring(0, 5)} ({schedule.durasi} jam)</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-pink-400" />
          <span className="truncate">{schedule.mapel}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-pink-400" />
          <span className="truncate">{schedule.name_student} ({schedule.name_parent})</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-pink-400" />
          <span className="truncate">{schedule.alamat}</span>
        </div>
      </div>

      {(schedule.description || schedule.eksklusif_request) && (
        <div className="mt-4 pt-4 border-t border-gray-100/50 space-y-2">
          {schedule.eksklusif_request && (
            <div className="text-xs">
              <span className="font-semibold text-gray-700">Request:</span> <span className="text-gray-600 bg-pink-50 px-2 py-0.5 rounded-full">{schedule.eksklusif_request}</span>
            </div>
          )}
          {schedule.description && (
            <p className="text-sm text-gray-500 italic">&quot;{schedule.description}&quot;</p>
          )}
        </div>
      )}
    </div>
  )
}
