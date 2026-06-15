import { ROLES, type Role } from '@/types/role';

type ControlNetStrength = 'Low' | 'Mid' | 'High';

type ControlNetConfig = {
  preprocessorId: number;
  strengthType: ControlNetStrength;
};

type ModelPreset = {
  controlnets: ControlNetConfig[];
  alchemy?: boolean;
  contrast?: number;
};

const FACE_IDENTITY_PREFIX =
  'Exact face match from the uploaded reference photo. The face must be identical to the reference person — same eyes, nose, mouth, jawline, skin tone, age, gender, hairstyle and identity. Do not invent a new face. ';

const FACE_IDENTITY_NEGATIVE =
  'different person, new face, generated face, random face, changed face, changed identity, face swap failure, wrong face, wrong gender, wrong age, celebrity face, lookalike';

const PROMPTS: Record<Role, string> = {
  miner: `${FACE_IDENTITY_PREFIX}Wide angle full body shot, entire person visible from head to feet with space around the body. FULL BODY photorealistic documentary portrait of the SAME PERSON from the reference photo. Clean natural face clearly visible, healthy skin, looking at camera. Professional coal miner standing straight in dark underground coal mine tunnel with arched metal support beams. Wearing weathered mining hard hat with bright headlamp, dark work jacket with reflective silver safety stripes, light coal dust on clothes only, self-rescuer on chest strap, heavy-duty work pants, thick rubber mining boots, holding mining tool. Dramatic mine lighting. Ultra realistic documentary photography, 8k.`,
  military_volunteer: `${FACE_IDENTITY_PREFIX}Wide angle full body shot, entire person visible from head to feet with space around the body. FULL BODY photorealistic documentary portrait of the SAME PERSON from the reference photo. Clean healthy face fully visible and uncovered, natural alive expression, looking at camera. Modern military volunteer soldier standing confidently in military training field. Multicam camouflage uniform, olive tactical plate carrier vest, camouflage helmet, tan combat boots, tactical gloves, holding assault rifle. Overcast sky, bare trees on horizon. Professional military appearance. Documentary photography, ultra realistic, 8k. Military volunteer NOT civilian volunteer.`,
  farmer: `${FACE_IDENTITY_PREFIX}Wide angle full body shot, entire person visible from head to feet with space around the body. FULL BODY photorealistic documentary portrait of the SAME PERSON from the reference photo. Clean natural face with friendly expression, looking at camera. Professional farmer standing with hands on hips in crop field. Straw hat, blue plaid flannel shirt, blue denim bib overalls, brown leather work boots. Green crop rows, red barn and silo in background. Golden hour daylight. Documentary photography, ultra realistic, 8k.`,
};

const NEGATIVE_PROMPTS: Record<Role, string> = {
  miner: `${FACE_IDENTITY_NEGATIVE}, headshot, face close up, bust shot, cropped body, half body, cut off legs, cut off feet, zombie, corpse, dead eyes, pale lifeless skin, muddy face, dirt covered face, cartoon, anime, low quality, blurry, extra people, deformed hands, bad anatomy, plastic skin`,
  military_volunteer: `${FACE_IDENTITY_NEGATIVE}, balaclava, face mask, covered face, muddy face, dirt on face, headshot, face close up, bust shot, cropped body, half body, cut off legs, zombie, corpse, dead eyes, civilian volunteer, charity worker, volunteer vest, cartoon, anime, low quality, blurry, extra people, deformed hands, bad anatomy, plastic skin`,
  farmer: `${FACE_IDENTITY_NEGATIVE}, headshot, face close up, bust shot, cropped body, half body, cut off legs, zombie, corpse, dead eyes, cartoon, anime, low quality, blurry, extra people, deformed hands, bad anatomy, plastic skin, indoor studio`,
};

const GENERATION_WIDTH = 768;
const GENERATION_HEIGHT = 1360;

const MODEL_PRESETS: Record<string, ModelPreset> = {
  'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3': {
    alchemy: true,
    contrast: 3.5,
    controlnets: [
      { preprocessorId: 397, strengthType: 'High' },
      { preprocessorId: 364, strengthType: 'Mid' },
    ],
  },
  '6b645e3a-d64f-4341-a6d8-7a3690fbf042': {
    alchemy: true,
    contrast: 3.5,
    controlnets: [
      { preprocessorId: 397, strengthType: 'High' },
      { preprocessorId: 364, strengthType: 'Mid' },
    ],
  },
  '7b592283-e8a7-4c5a-9ba6-d18c31f258b9': {
    controlnets: [{ preprocessorId: 430, strengthType: 'High' }],
  },
  '05ce0082-2d80-4a2d-8653-4d1c85e2418e': {
    controlnets: [{ preprocessorId: 430, strengthType: 'High' }],
  },
};

const DEFAULT_MODEL_PRESET: ModelPreset = {
  controlnets: [{ preprocessorId: 430, strengthType: 'High' }],
};

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;

const getConfig = () => ({
  apiKey: process.env.LEONARDO_API_KEY ?? '',
  apiUrl: process.env.LEONARDO_API_URL ?? 'https://cloud.leonardo.ai/api/rest/v1',
  modelId: process.env.LEONARDO_MODEL_ID ?? '',
});

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const mimeFromExtension = (extension: string): string => {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[extension] ?? 'image/jpeg';
};

const requestWithRetry = async <T>(path: string, init: RequestInit): Promise<T> => {
  const { apiKey, apiUrl } = getConfig();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
          ...init.headers,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Leonardo API error ${response.status}: ${body}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError ?? new Error('Leonardo API request failed');
};

const uploadReferenceImage = async (imageBuffer: Buffer, extension: string): Promise<string> => {
  const initResponse = await requestWithRetry<{
    uploadInitImage: { id: string; fields: string; url: string };
  }>('/init-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ extension }),
  });

  const { id, fields, url } = initResponse.uploadInitImage;
  const parsedFields = JSON.parse(fields) as Record<string, string>;

  const formData = new FormData();
  Object.entries(parsedFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const blob = new Blob([new Uint8Array(imageBuffer)], {
    type: mimeFromExtension(extension),
  });
  formData.append('file', blob, `reference.${extension}`);

  const uploadResponse = await fetch(url, { method: 'POST', body: formData });
  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload reference image: ${uploadResponse.status}`);
  }

  return id;
};

const createGeneration = async (referenceImageId: string, role: Role): Promise<string> => {
  const { modelId } = getConfig();
  const modelPreset = MODEL_PRESETS[modelId] ?? DEFAULT_MODEL_PRESET;

  const response = await requestWithRetry<{
    sdGenerationJob: { generationId: string };
  }>('/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      height: GENERATION_HEIGHT,
      width: GENERATION_WIDTH,
      modelId,
      prompt: PROMPTS[role],
      negative_prompt: NEGATIVE_PROMPTS[role],
      guidance_scale: 6,
      num_images: 1,
      ...(modelPreset.alchemy ? { alchemy: true } : {}),
      ...(modelPreset.contrast ? { contrast: modelPreset.contrast } : {}),
      controlnets: modelPreset.controlnets.map((controlnet) => ({
        initImageId: referenceImageId,
        initImageType: 'UPLOADED',
        preprocessorId: controlnet.preprocessorId,
        strengthType: controlnet.strengthType,
      })),
    }),
  });

  return response.sdGenerationJob.generationId;
};

const waitForGeneration = async (generationId: string): Promise<string> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < TIMEOUT_MS) {
    const response = await requestWithRetry<{
      generations_by_pk: {
        status: string;
        generated_images: Array<{ url: string }>;
      };
    }>(`/generations/${generationId}`, { method: 'GET' });

    const generation = response.generations_by_pk;

    if (generation.status === 'COMPLETE') {
      const imageUrl = generation.generated_images[0]?.url;
      if (!imageUrl) {
        throw new Error('Generation completed without image URL');
      }
      return imageUrl;
    }

    if (generation.status === 'FAILED') {
      throw new Error('Leonardo generation failed');
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Generation timeout exceeded');
};

export const generateImageFromPhoto = async (
  imageBuffer: Buffer,
  extension: string,
  role: Role,
): Promise<string> => {
  const referenceImageId = await uploadReferenceImage(imageBuffer, extension);
  const generationId = await createGeneration(referenceImageId, role);
  return waitForGeneration(generationId);
};

export const isValidRole = (role: string): role is Role =>
  ROLES.includes(role as Role);

export const extensionFromMime = (mime: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mime] ?? 'jpg';
};
