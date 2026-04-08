# 📐 Архитектура проекта SkyBooker

## Оглавление

1. [Общая архитектура](#общая-архитектура)
2. [Структура проекта](#структура-проекта)
3. [Доменная модель](#доменная-модель)
4. [Компоненты приложения](#компоненты-приложения)
5. [Маршрутизация](#маршрутизация)
6. [Управление состоянием](#управление-состоянием)
7. [Стилизация](#стилизация)
8. [Типизация](#типизация)

---

## Общая архитектура

SkyBooker построен на основе **современной SPA-архитектуры** с использованием Next.js 16 (App Router).

### Архитектурные принципы

1. **Component-Based Architecture** - модульная структура с переиспользуемыми компонентами
2. **Type Safety** - строгая типизация с TypeScript для предотвращения ошибок
3. **Separation of Concerns** - разделение бизнес-логики, представления и данных
4. **Mobile-First Design** - адаптивный дизайн с приоритетом мобильных устройств
5. **Server-Side Rendering** - использование SSR для оптимизации производительности

### Технологический стек

```
Frontend Framework: Next.js 16 (React 19)
Language: TypeScript 5
Styling: Tailwind CSS 3
UI Components: Radix UI
Icons: Lucide React
Theme Management: next-themes
```

---

## Структура проекта

```
skybooker/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Корневой layout с Header/Footer
│   ├── page.tsx                 # Главная страница (/)
│   ├── search/                  # Страница результатов поиска
│   │   └── page.tsx            # /search
│   ├── booking/                 # Страница оформления бронирования
│   │   └── page.tsx            # /booking
│   ├── payment/                 # Страница оплаты
│   │   └── page.tsx            # /payment
│   └── profile/                 # Личный кабинет
│       └── page.tsx            # /profile
│
├── components/                   # React-компоненты
│   ├── common/                  # Общие компоненты
│   │   ├── Hero.tsx            # Hero-секция главной страницы
│   │   ├── Logo.tsx            # Логотип приложения
│   │   ├── ThemeSwitch.tsx     # Переключатель темы
│   │   └── GlassCard.tsx       # Карточка с эффектом стекла
│   ├── features/                # Функциональные компоненты
│   │   └── FlightSearchForm.tsx # Форма поиска рейсов
│   ├── layout/                  # Layout-компоненты
│   │   ├── Header.tsx          # Шапка сайта
│   │   └── Footer.tsx          # Подвал сайта
│   ├── ui/                      # UI-компоненты (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── navigation-menu.tsx
│   │   └── sheet.tsx
│   └── MainPage.tsx             # Компонент главной страницы
│
├── types/                        # TypeScript типы
│   └── index.ts                 # Доменные типы (Flight, Fare, Booking, etc.)
│
├── data/                         # Mock-данные
│   └── mockFlights.ts           # Тестовые данные рейсов
│
├── lib/                          # Утилиты
│   └── utils.ts                 # Вспомогательные функции
│
├── styles/                       # Глобальные стили
│   └── glass.css                # Стили для glassmorphism
│
└── providers/                    # React Context Providers
    └── ThemeProvider.tsx        # Провайдер темы
```

---

## Доменная модель

### Основные сущности

#### 1. Flight (Рейс)

Представляет авиарейс с полной информацией о маршруте и времени.

**Атрибуты:**

- `id` - уникальный идентификатор
- `flightNumber` - номер рейса (например, "SU1234")
- `airline` - название авиакомпании
- `origin/destination` - города отправления/прибытия
- `departureTime/arrivalTime` - время вылета/прилета
- `duration` - длительность полета в минутах
- `aircraftType` - тип воздушного судна
- `availableSeats` - количество доступных мест

#### 2. Fare (Тариф)

Ценовое предложение для конкретного рейса.

**Типы тарифов:**

- `Economy` - эконом-класс
- `Comfort` - комфорт-класс
- `Business` - бизнес-класс

**Атрибуты:**

- `price` - стоимость
- `baggage` - информация о багаже
- `refundable` - возможность возврата
- `changeable` - возможность изменения
- `features` - дополнительные услуги

#### 3. Passenger (Пассажир)

Информация о пассажире для бронирования.

**Атрибуты:**

- Персональные данные (имя, фамилия, дата рождения)
- Документ (тип, номер, срок действия)
- Контактная информация (email, телефон)

#### 4. Booking (Бронирование)

Заказ на перелет с полной информацией.

**Статусы:**

- `created` - создано
- `pending_payment` - ожидает оплаты
- `paid` - оплачено
- `cancelled` - отменено
- `completed` - завершено

**Атрибуты:**

- `pnr` - уникальный код бронирования
- `passengers` - список пассажиров
- `totalPrice` - общая стоимость
- `status` - текущий статус

#### 5. Payment (Платеж)

Информация о платежной транзакции.

**Способы оплаты:**

- `card` - банковская карта
- `apple_pay` - Apple Pay
- `google_pay` - Google Pay
- `bank_transfer` - банковский перевод

---

## Компоненты приложения

### Layout-компоненты

#### Header

**Расположение:** [`components/layout/Header.tsx`](components/layout/Header.tsx)

**Функциональность:**

- Логотип с навигацией на главную
- Кнопка поиска рейсов
- Доступ к бронированиям
- Личный кабинет
- Переключатель темы

**Особенности:**

- Фиксированная позиция с эффектом glassmorphism
- Адаптивный дизайн для мобильных устройств

#### Footer

**Расположение:** [`components/layout/Footer.tsx`](components/layout/Footer.tsx)

**Содержимое:**

- Информация о компании
- Контактные данные (телефон, email, адрес)
- Ссылки на социальные сети
- Copyright

### Feature-компоненты

#### FlightSearchForm

**Расположение:** [`components/features/FlightSearchForm.tsx`](components/features/FlightSearchForm.tsx)

**Функциональность:**

- Ввод города отправления
- Ввод города прибытия
- Выбор даты вылета
- Выбор количества пассажиров
- Валидация данных
- Отправка запроса на поиск

**Технические детали:**

- Использует React hooks (useState)
- Валидация на стороне клиента
- Адаптивная верстка

### Common-компоненты

#### Hero

**Расположение:** [`components/common/Hero.tsx`](components/common/Hero.tsx)

**Описание:**
Hero-секция с градиентным фоном, декоративными элементами (облака, самолет) и призывом к действию.

#### Logo

**Расположение:** [`components/common/Logo.tsx`](components/common/Logo.tsx)

**Описание:**
Логотип приложения с иконкой самолета и названием "SkyBooker".

---

## Маршрутизация

### Структура маршрутов

| Маршрут    | Компонент              | Описание                          |
| ---------- | ---------------------- | --------------------------------- |
| `/`        | `app/page.tsx`         | Главная страница с формой поиска  |
| `/search`  | `app/search/page.tsx`  | Результаты поиска рейсов          |
| `/booking` | `app/booking/page.tsx` | Оформление бронирования           |
| `/payment` | `app/payment/page.tsx` | Страница оплаты                   |
| `/profile` | `app/profile/page.tsx` | Личный кабинет (мои бронирования) |

### Навигация между страницами

```typescript
// Программная навигация
window.location.href = "/search";

// Навигация через Link (Next.js)
<Link href="/booking">Забронировать</Link>;
```

---

## Управление состоянием

### Локальное состояние (useState)

Используется для управления состоянием внутри компонентов:

```typescript
const [origin, setOrigin] = useState("");
const [destination, setDestination] = useState("");
const [passengers, setPassengers] = useState(1);
```

### Контекст (React Context)

**ThemeProvider** - управление темой приложения (светлая/темная).

```typescript
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  {children}
</ThemeProvider>
```

### Будущие улучшения

Для production-версии рекомендуется:

- Redux Toolkit для глобального состояния
- React Query для кеширования API-запросов
- Zustand для легковесного state management

---

## Стилизация

### Tailwind CSS

Основной подход к стилизации - utility-first CSS с Tailwind.

**Примеры:**

```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    Заголовок
  </h2>
</div>
```

### Темная тема

Поддержка темной темы через `dark:` префикс:

```tsx
className = "text-gray-900 dark:text-white";
```

### Glassmorphism

Эффект матового стекла для современного дизайна:

```css
.bg-liquid-glass {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.7);
}
```

### Адаптивность

Responsive breakpoints:

- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

---

## Типизация

### TypeScript конфигурация

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "preserve"
  }
}
```

### Основные типы

Все доменные типы определены в [`types/index.ts`](types/index.ts):

```typescript
export interface Flight { ... }
export interface Fare { ... }
export interface Passenger { ... }
export interface Booking { ... }
export interface Payment { ... }
```

### Type Safety

Строгая типизация обеспечивает:

- Автодополнение в IDE
- Проверку типов на этапе компиляции
- Предотвращение runtime-ошибок
- Улучшенную документацию кода

---

## Интеграция с Backend API

### Текущая реализация (Mock)

В текущей версии используются mock-данные из [`data/mockFlights.ts`](data/mockFlights.ts).

### Будущая интеграция

Для production-версии необходимо:

1. **API Client**

```typescript
// lib/api/flights.ts
export async function searchFlights(params: FlightSearchParams) {
  const response = await fetch("/api/flights/search", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return response.json();
}
```

2. **API Routes** (Next.js API Routes)

```typescript
// app/api/flights/search/route.ts
export async function POST(request: Request) {
  const params = await request.json();
  // Логика поиска рейсов
  return Response.json({ flights, fares });
}
```

3. **Error Handling**

```typescript
try {
  const data = await searchFlights(params);
} catch (error) {
  console.error("Ошибка поиска:", error);
}
```

---

## Оптимизация производительности

### Next.js оптимизации

1. **Server Components** - рендеринг на сервере для быстрой загрузки
2. **Image Optimization** - автоматическая оптимизация изображений
3. **Code Splitting** - автоматическое разделение кода по маршрутам
4. **Lazy Loading** - отложенная загрузка компонентов

### Best Practices

1. Использование `React.memo` для предотвращения лишних ре-рендеров
2. Оптимизация списков с `key` prop
3. Debouncing для поисковых запросов
4. Кеширование API-ответов

---

## Безопасность

### Текущие меры

1. **Input Validation** - валидация всех пользовательских данных
2. **Type Safety** - TypeScript предотвращает многие ошибки
3. **HTTPS** - обязательное использование в production

### Рекомендации для production

1. **Authentication** - JWT токены для авторизации
2. **CSRF Protection** - защита от CSRF-атак
3. **Rate Limiting** - ограничение частоты запросов
4. **Data Encryption** - шифрование чувствительных данных
5. **Input Sanitization** - очистка пользовательского ввода

---

## Тестирование

### Рекомендуемый стек

1. **Unit Tests** - Jest + React Testing Library
2. **Integration Tests** - Playwright или Cypress
3. **E2E Tests** - Playwright для полного flow

### Примеры тестов

```typescript
// __tests__/FlightSearchForm.test.tsx
describe("FlightSearchForm", () => {
  it("should validate required fields", () => {
    // Тест валидации
  });

  it("should submit search request", () => {
    // Тест отправки формы
  });
});
```

---

## Развертывание

### Vercel (рекомендуется)

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## Заключение

Архитектура SkyBooker построена с учетом:

- ✅ Масштабируемости
- ✅ Поддерживаемости
- ✅ Производительности
- ✅ Безопасности
- ✅ Лучших практик разработки

Проект готов для использования в качестве основы ВКР и дальнейшего развития в production-приложение.
