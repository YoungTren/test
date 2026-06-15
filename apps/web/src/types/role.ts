export type Role = 'miner' | 'military_volunteer' | 'farmer';

export const ROLES: Role[] = ['miner', 'military_volunteer', 'farmer'];

export type RoleOption = {
  value: Role;
  label: string;
};

export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'miner', label: 'Шахтёр' },
  { value: 'military_volunteer', label: 'Доброволец' },
  { value: 'farmer', label: 'Фермер' },
];

export type GenerateResponse = {
  success: true;
  imageUrl: string;
};
