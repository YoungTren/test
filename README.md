# AI Photo Booth MVP

Веб-приложение из одной страницы: пользователь загружает или делает фото и преобразует себя в один из трёх AI-образов через Leonardo AI.

Полная спецификация: [product.md](./product.md)

---

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend + API | Next.js, React, TypeScript, Tailwind CSS |
| AI | Leonardo AI API |
| Деплой | Vercel (один сервис) |

NestJS backend (`apps/api`) — опционально для локальной разработки, для продакшена не нужен.

---

## Требования

- Node.js 20+
- npm
- Ключ Leonardo AI API

---

## Локальный запуск

1. Скопируйте env:

```bash
cp .env.example apps/web/.env.local
```

2. Заполните `apps/web/.env.local`:

```env
LEONARDO_API_KEY=your_api_key
LEONARDO_MODEL_ID=de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3
LEONARDO_API_URL=https://cloud.leonardo.ai/api/rest/v1
```

3. Установка и запуск:

```bash
npm install
npm run dev:web
```

Откройте [http://localhost:3000](http://localhost:3000).

API: `POST /api/generate` — внутри Next.js, отдельный backend не нужен.

---

## Деплой на Vercel

1. **Root Directory:** `apps/web`
2. **Framework:** Next.js
3. **Environment Variables** (Settings → Environment Variables):

```env
LEONARDO_API_KEY=your_api_key
LEONARDO_API_URL=https://cloud.leonardo.ai/api/rest/v1
LEONARDO_MODEL_ID=de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3
```

4. **Redeploy**

Генерация может занимать до 120 секунд. Route настроен с `maxDuration = 120`. На бесплатном плане Vercel лимит 10 сек — для MVP нужен **Pro** или локальный запуск.

`NEXT_PUBLIC_API_URL` **не нужен** — frontend вызывает `/api/generate` на том же домене.

---

## Тестирование

1. Подтвердите согласие
2. Сделайте или загрузите фото (JPG/PNG/WebP, max 10 MB)
3. Нажмите «Шахтёр», «Доброволец» или «Фермер»
4. Дождитесь результата (30–120 сек)
5. «Сохранить изображение» — скачивание на устройство

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "image=@/path/to/photo.jpg" \
  -F "role=miner"
```

---

## Структура проекта

```
test/
├── apps/
│   ├── web/                    # Next.js (UI + /api/generate)
│   └── api/                    # NestJS (опционально, локально)
├── product.md
├── .env.example
└── README.md
```

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev:web` | Запуск Next.js |
| `npm run dev:api` | NestJS (опционально) |
| `npm run build:web` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

---

## Лицензия

Private project.
