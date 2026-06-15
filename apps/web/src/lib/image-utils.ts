const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Поддерживаются только JPG, PNG и WebP';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Максимальный размер — 10 MB';
  }

  return null;
};

export const captureVideoFrame = (
  video: HTMLVideoElement,
  filename = 'camera-photo.jpg',
): File => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Не удалось получить canvas context');
  }

  context.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const byteString = atob(dataUrl.split(',')[1] ?? '');
  const buffer = new Uint8Array(byteString.length);

  for (let index = 0; index < byteString.length; index += 1) {
    buffer[index] = byteString.charCodeAt(index);
  }

  return new File([buffer], filename, { type: 'image/jpeg' });
};

export const downloadImage = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(objectUrl);
};
