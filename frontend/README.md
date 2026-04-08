# SkyBooker — Frontend

Клиентская часть информационной системы авиакомпании. Next.js 15, TypeScript, Tailwind.

---

## Стек

- **Next.js 15** (App Router)
- **React 19**, **TypeScript**
- **Tailwind CSS** + **Radix UI** (shadcn-компоненты)
- **Lucide React** — иконки
- **next-themes** — light/dark переключение

---

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production-сборка
npm run lint
```

Бэкенд должен работать на `http://localhost:3001`. Настраивается через переменную окружения:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Структура

```
frontend/
├── app/                   # Страницы (App Router)
│   ├── page.tsx           # Главная
│   ├── search/            # Результаты поиска рейсов
│   ├── booking/           # Оформление бронирования
│   ├── payment/           # Оплата
│   ├── profile/           # Личный кабинет
│   ├── ticket/[id]/       # Электронный билет
│   ├── dashboard/         # Панель сотрудника
│   ├── account/           # Аккаунт
│   └── auth/              # Вход, регистрация, сброс пароля
├── components/
│   ├── common/            # Hero, Logo, GlassCard, ThemeSwitch
│   ├── features/          # FlightSearchForm
│   ├── layout/            # Header, Footer
│   └── ui/                # Radix-based компоненты
├── lib/
│   ├── api/client.ts      # HTTP-клиент с авто-подстановкой Bearer-токена
│   └── services/          # authService
├── types/                 # TypeScript-типы (database, dto, index)
└── providers/             # ThemeProvider
```

---

## Страницы

| Путь | Описание |
|------|----------|
| `/` | Главная с формой поиска |
| `/search` | Список рейсов с фильтрами и сортировкой |
| `/booking` | Ввод данных пассажиров, выбор тарифа |
| `/payment` | Выбор способа оплаты |
| `/ticket/[id]` | Электронный билет |
| `/profile` | История бронирований пользователя |
| `/dashboard` | Статистика и управление рейсами (employee/admin) |
| `/auth/login` | Вход |
| `/auth/register` | Регистрация |

---

## API-клиент

`lib/api/client.ts` — обёртка над `fetch`:

- автоматически подставляет `Authorization: Bearer <token>` если `requiresAuth = true`
- при получении 401 очищает токен и редиректит на `/auth/login`
- пробрасывает ошибки как `APIError` с кодом и сообщением с бэкенда

---

## Типизация

Основные типы в `types/`:

```typescript
// types/index.ts
Flight, Fare, Passenger, Booking, Payment

// types/dto.ts
LoginRequestDTO, LoginResponseDTO, RegisterRequestDTO, UserDTO

// types/database.ts
UserRole ('passenger' | 'agent' | 'employee' | 'admin')
```
