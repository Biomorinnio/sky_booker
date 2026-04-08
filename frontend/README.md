# ✈️ SkyBooker

**Веб-платформа для поиска, сравнения и онлайн-бронирования авиабилетов**

---

## 📋 О проекте

SkyBooker — это современное SPA-приложение для онлайн-бронирования авиабилетов, разработанное в рамках выпускной квалификационной работы (ВКР).

Платформа предоставляет пользователям удобный интерфейс для:

- 🔍 Поиска авиарейсов по направлениям и датам
- 💺 Выбора тарифов (Economy, Comfort, Business)
- 📝 Оформления бронирования с указанием данных пассажиров
- 💳 Онлайн-оплаты бронирований
- 📱 Управления своими бронированиями в личном кабинете

---

## 🏗️ Архитектура

Проект построен на современном frontend-стеке с использованием лучших практик разработки:

### Технологический стек

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Theme**: next-themes (light/dark mode)

### Структура проекта

```
skybooker/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Корневой layout
│   ├── page.tsx           # Главная страница
│   ├── search/            # Страница результатов поиска
│   ├── booking/           # Страница оформления бронирования
│   ├── payment/           # Страница оплаты
│   └── profile/           # Личный кабинет
├── components/            # React-компоненты
│   ├── common/           # Общие компоненты
│   ├── layout/           # Layout-компоненты (Header, Footer)
│   ├── features/         # Функциональные компоненты
│   └── ui/               # UI-компоненты (shadcn/ui)
├── lib/                  # Утилиты и хелперы
├── types/                # TypeScript типы и интерфейсы
├── data/                 # Mock-данные для разработки
└── styles/               # Глобальные стили

```

---

## 🎯 Доменная модель

### Основные сущности

#### Flight (Рейс)

```typescript
interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // в минутах
  aircraftType: string;
  availableSeats: number;
}
```

#### Fare (Тариф)

```typescript
interface Fare {
  id: string;
  flightId: string;
  type: "Economy" | "Comfort" | "Business";
  price: number;
  currency: string;
  baggage: {
    cabin: string; // ручная кладь
    checked: string; // багаж в трюм
  };
  refundable: boolean;
  changeable: boolean;
}
```

#### Passenger (Пассажир)

```typescript
interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  documentType: "passport" | "id_card";
  documentNumber: string;
  nationality: string;
}
```

#### Booking (Бронирование)

```typescript
interface Booking {
  id: string;
  flightId: string;
  fareId: string;
  passengers: Passenger[];
  totalPrice: number;
  currency: string;
  status: "created" | "paid" | "cancelled";
  createdAt: Date;
  pnr: string; // Passenger Name Record
}
```

#### Payment (Платеж)

```typescript
interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: "card" | "paypal" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  transactionId: string;
  createdAt: Date;
}
```

---

## 🚀 Запуск проекта

### Требования

- Node.js 20+
- npm, yarn, pnpm или bun

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Сборка для production

```bash
npm run build
npm start
```

### Линтинг

```bash
npm run lint
```

---

## 📄 Основные страницы

### 1. Главная страница (`/`)

- Форма поиска рейсов (город отправления, город прибытия, дата, количество пассажиров)
- Популярные направления
- Преимущества сервиса

### 2. Результаты поиска (`/search`)

- Список найденных рейсов
- Фильтрация по цене, времени вылета, авиакомпании
- Сортировка (по цене, времени, длительности)
- Выбор тарифа для каждого рейса

### 3. Оформление бронирования (`/booking`)

- Ввод данных пассажиров
- Выбор дополнительных услуг
- Итоговая стоимость
- Подтверждение условий

### 4. Оплата (`/payment`)

- Выбор способа оплаты
- Ввод платежных данных
- Подтверждение оплаты

### 5. Личный кабинет (`/profile`)

- Список бронирований пользователя
- Детали каждого бронирования
- Возможность отмены бронирования

---

## 🎨 Дизайн и UX

- **Адаптивный дизайн**: полная поддержка мобильных устройств, планшетов и десктопов
- **Темная тема**: переключение между светлой и темной темой
- **Glassmorphism**: современный стиль с эффектом матового стекла
- **Анимации**: плавные переходы и hover-эффекты
- **Доступность**: соблюдение стандартов WCAG

---

## 🔧 Особенности реализации

### Архитектурные принципы

- **Component-based architecture**: модульная структура компонентов
- **Type safety**: строгая типизация с TypeScript
- **Separation of concerns**: разделение бизнес-логики и представления
- **Reusability**: переиспользуемые UI-компоненты

### Управление состоянием

- React hooks (useState, useEffect, useContext)
- Server Components для оптимизации производительности

### API Integration

- Готовая структура для интеграции с backend API
- Mock-данные для демонстрации функционала

---

## 📚 Использование в ВКР

Проект подходит для защиты ВКР по темам:

- Разработка веб-приложений
- Frontend-разработка
- Системы онлайн-бронирования
- UX/UI дизайн

### Ключевые аспекты для описания в работе:

1. Анализ предметной области (авиационные бронирования)
2. Проектирование архитектуры SPA-приложения
3. Разработка доменной модели
4. Реализация пользовательского интерфейса
5. Обеспечение адаптивности и доступности
6. Тестирование и оптимизация

---

## 📝 Лицензия

Этот проект создан в образовательных целях для выпускной квалификационной работы.

---

## 👨‍💻 Автор

Разработано как часть ВКР по теме: **"Разработка веб-платформы для онлайн-бронирования авиабилетов"**

---

## 🔗 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)
