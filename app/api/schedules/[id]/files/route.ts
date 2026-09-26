import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export const runtime = 'nodejs'

const BUCKET = 'schedule-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
  'xls',
  'xlsx',
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scheduleId } = await params

  if (!scheduleId) {
    return NextResponse.json({ error: 'Schedule ID tidak valid' }, { status: 400 })
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('id')
    .eq('id', scheduleId)
    .single()

  if (scheduleError || !schedule) {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files').filter((value): value is File => value instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 })
  }

  const uploadedFiles = []

  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.name}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file maksimal 10 MB: ${file.name}` },
        { status: 400 }
      )
    }

    const filePath = `${scheduleId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading schedule file:', uploadError)
      return NextResponse.json(
        { error: `Gagal mengupload ${file.name}: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: fileRecord, error: insertError } = await supabase
      .from('schedule_files')
      .insert({
        schedule_id: scheduleId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || null,
        file_size: file.size,
      })
      .select('id, file_name, file_path, file_type, file_size, created_at')
      .single()

    if (insertError) {
      console.error('Error saving schedule file metadata:', insertError)
      await supabase.storage.from(BUCKET).remove([filePath])

      return NextResponse.json(
        { error: `File berhasil diupload tetapi metadata gagal disimpan: ${insertError.message}` },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    uploadedFiles.push({
      ...fileRecord,
      public_url: publicUrlData.publicUrl,
    })
  }

  return NextResponse.json({
    success: true,
    files: uploadedFiles,
  })
}
