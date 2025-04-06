import { writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { auth } from '@/app/(auth)/auth';

// ファイルのバリデーションスキーマ（20MB & JPEG/PNG）
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: 'File size should be less than 20MB',
    })
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!request.body) {
    return NextResponse.json(
      { error: 'Request body is empty' },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const ext = path.extname(file.name); // 拡張子を維持
    const uniqueFilename = `${nanoid()}${ext}`; // ユニークなファイル名を生成

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, uniqueFilename);

    try {
      await writeFile(filePath, buffer);
      return NextResponse.json({
        url: `/uploads/${uniqueFilename}`,
        name: uniqueFilename,
        contentType: file.type,
      });
    } catch (err) {
      console.error('❌ Failed to save file:', err);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
