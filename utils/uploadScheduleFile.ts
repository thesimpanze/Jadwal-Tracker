import { supabase } from "@/utils/supabase";

export async function uploadScheduleFile(scheduleId: string, file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${scheduleId}/${fileName}`;

  const { error } = await supabase.storage
    .from("schedule-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal upload file: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("schedule-files")
    .getPublicUrl(filePath);

  return {
    fileName: file.name,
    filePath,
    fileType: file.type,
    fileSize: file.size,
    publicUrl: data.publicUrl,
  };
}
