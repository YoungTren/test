import type { GenerateResponse, Role } from '@/types/role';

export const generateImage = async (
  sourceImage: File,
  role: Role,
): Promise<GenerateResponse> => {
  const formData = new FormData();
  formData.append('image', sourceImage);
  formData.append('role', role);

  const response = await fetch('/api/generate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String(body.message)
        : `Ошибка генерации (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<GenerateResponse>;
};
