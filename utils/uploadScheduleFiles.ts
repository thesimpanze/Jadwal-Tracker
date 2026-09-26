export async function uploadScheduleFiles(scheduleId: string, files: File[]) {
  if (files.length === 0) {
    return { success: true, files: [] }
  }

  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(`/api/schedules/${scheduleId}/files`, {
    method: 'POST',
    body: formData,
  })

  const result = await response.json().catch(() => null)

  if (!response.ok || !result?.success) {
    throw new Error(result?.error || 'Gagal mengupload file')
  }

  return result
}
