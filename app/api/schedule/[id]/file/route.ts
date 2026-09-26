import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: scheduleId } = await params;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 },
      );
    }

    // Batasi ukuran file, contoh 10 MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10 MB" },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung" },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${scheduleId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("schedule-files")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("schedule-files")
      .getPublicUrl(filePath);

    const { data: scheduleFile, error: dbError } = await supabase
      .from("schedule_files")
      .insert({
        schedule_id: scheduleId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Kalau insert database gagal, hapus file yang sudah ter-upload
      await supabase.storage.from("schedule-files").remove([filePath]);

      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: {
        ...scheduleFile,
        public_url: publicUrlData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat upload file" },
      { status: 500 },
    );
  }
}
