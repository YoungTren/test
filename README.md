# AI Photo Booth MVP

Веб-приложение из одной страницы: пользователь загружает или делает фото и преобразует себя в один из трёх AI-образов через Leonardo AI.

Полная спецификация: [product.md](./product.md)

---

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| AI | Leonardo AI API |
| Storage | Локальная папка `apps/api/uploads/` |

---

## Требования

- Node.js 20+
- npm
- Ключ Leonardo AI API

---

## Настройка Leonardo API

1. Зарегистрируйтесь на [Leonardo AI](https://leonardo.ai/) и создайте API-ключ.
2. Скопируйте `.env.example` в `.env` в корне проекта и в `apps/api/.env`:

```bash
cp .env.example .env
cp .env.example apps/api/.env
```

3. Заполните переменные:

```env
LEONARDO_API_KEY=your_api_key
LEONARDO_MODEL_ID=your_model_id
LEONARDO_API_URL=https://cloud.leonardo.ai/api/rest/v1
```

Model ID можно получить через [Leonardo API — List Platform Models](https://docs.leonardo.ai/reference/listplatformmodels) или в интерфейсе Leonardo AI.

4. Для frontend создайте `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Установка

```bash
npm install
```

---

## Запуск

### Backend (порт 3001)

```bash
npm run dev:api
```

### Frontend (порт 3000)

В отдельном терминале:

```bash
npm run dev:web
```

Откройте [http://localhost:3000](http://localhost:3000).

---

## Тестирование приложения

1. Откройте страницу в Chrome или Safari (desktop/mobile).
2. Поставьте галочку согласия — кнопки «Сделать фото» и «Загрузить фото» станут активны.
3. Сделайте снимок через камеру **или** загрузите JPG/PNG/WebP до 10 MB.
4. Убедитесь, что исходное фото отображается в блоке превью.
5. Нажмите «Шахтёр», «Доброволец» или «Фермер» — появится индикатор «Генерация...».
6. После завершения результат заменит превью.
7. Переключитесь на другой образ — каждый запрос использует **исходное** фото, не предыдущий результат.
8. Нажмите «Сохранить изображение» — файл скачается на устройство.

### Проверка API напрямую

```bash
curl -X POST http://localhost:3001/api/generate \
  -F "image=@/path/to/photo.jpg" \
  -F "role=miner"
```

Ожидаемый ответ:

```json
{
  "success": true,
  "imageUrl": "http://localhost:3001/api/uploads/generated/..."
}
```

---

## Структура проекта

```
test/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── product.md
├── .env.example
└── README.md
```

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev:web` | Запуск frontend |
| `npm run dev:api` | Запуск backend с hot reload |
| `npm run build` | Production build frontend + backend |
| `npm run lint` | ESLint для frontend |
| `npm run test` | Vitest для frontend |

---

## Лицензия

Private project.
