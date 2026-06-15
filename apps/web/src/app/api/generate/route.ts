import {
  extensionFromMime,
  generateImageFromPhoto,
  isValidRole,
} from '@/lib/leonardo/leonardo.service';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const POST = async (request: Request) => {
  const formData = await request.formData();
  const image = formData.get('image');
  const role = formData.get('role');

  if (!(image instanceof File)) {
    return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
  }

  if (typeof role !== 'string' || !isValidRole(role)) {
    return NextResponse.json(
      { message: 'Invalid role. Allowed: miner, military_volunteer, farmer' },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIMES.has(image.type)) {
    return NextResponse.json(
      { message: 'Invalid file format. Allowed: jpg, jpeg, png, webp' },
      { status: 400 },
    );
  }

  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: 'File size exceeds 10 MB limit' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const extension = extensionFromMime(image.type);

  try {
    const imageUrl = await generateImageFromPhoto(buffer, extension, role);
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('timeout')) {
      return NextResponse.json({ message: 'Generation timeout exceeded' }, { status: 504 });
    }

    return NextResponse.json({ message: `Leonardo AI error: ${message}` }, { status: 502 });
  }
};
