export type Role = 'miner' | 'military_volunteer' | 'farmer';

export const ROLES: Role[] = ['miner', 'military_volunteer', 'farmer'];

export type GenerateResponse = {
  success: true;
  imageUrl: string;
};

export type LeonardoInitImageResponse = {
  uploadInitImage: {
    id: string;
    fields: string;
    key: string;
    url: string;
  };
};

export type LeonardoCreateGenerationResponse = {
  sdGenerationJob: {
    generationId: string;
  };
};

export type LeonardoGenerationStatus = 'PENDING' | 'COMPLETE' | 'FAILED';

export type LeonardoGetGenerationResponse = {
  generations_by_pk: {
    status: LeonardoGenerationStatus;
    generated_images: Array<{ url: string }>;
  };
};
