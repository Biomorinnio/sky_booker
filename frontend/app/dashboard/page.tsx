"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  CreditCard,
  Plane,
  Plus,
  Route,
  Settings2,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { authService } from "@/lib/services/authService";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardTab = "stats" | "flights" | "fares" | "bookings";

interface DashboardStats {
  totalFlights?: number;
  totalBookings?: number;
  totalRevenue?: number;
  averageOccupancy?: number;
  topRoutes?: { route: string; bookings: number }[];
}

interface AirportRow {
  id: string;
  code: string;
  city: string;
  name: string;
}

interface AircraftRow {
  id: string;
  registrationNumber: string;
  model: string;
  totalSeats: number;
}

interface FlightRow {
  id: string;
  flightNumber: string;
  aircraft?: { model?: string; registrationNumber?: string };
  origin?: { id?: string; code?: string; city?: string };
  destination?: { id?: string; code?: string; city?: string };
  scheduledDeparture?: string;
  scheduledArrival?: string;
  availableSeats?: number;
  status: string;
  fares?: FareRow[];
}

interface FareRow {
  id: string;
  class: string;
  price: number;
  availableSeats: number;
  isRefundable: boolean;
  isChangeable: boolean;
}

interface BookingRow {
  id: string;
  pnr?: string;
  status: string;
  totalAmount?: number;
  flight?: {
    flightNumber?: string;
    origin?: { code?: string; city?: string };
    destination?: { code?: string; city?: string };
  };
  fare?: { class?: string };
}

const bookingStatusLabels: Record<string, string> = {
  created: "Создано",
  pending_payment: "Ожидает оплаты",
  confirmed: "Оплачено",
  checked_in: "Зарегистрирован",
  completed: "Завершено",
  cancelled: "Отменено",
  refunded: "Возвращено",
};

const fareLabels: Record<string, string> = {
  economy: "Эконом",
  comfort: "Комфорт",
  business: "Бизнес",
  first: "Первый",
};

const tabs: { id: DashboardTab; label: string; icon: ReactNode }[] = [
  { id: "stats", label: "Статистика", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "flights", label: "Рейсы", icon: <Plane className="w-4 h-4" /> },
  { id: "fares", label: "Тарифы", icon: <Ticket className="w-4 h-4" /> },
  { id: "bookings", label: "Бронирования", icon: <Users className="w-4 h-4" /> },
];

const emptyFlightForm = {
  flightNumber: "",
  aircraftId: "",
  originAirportId: "",
  destinationAirportId: "",
  scheduledDeparture: "",
  scheduledArrival: "",
  gate: "",
  terminal: "",
};

const emptyFareForm = {
  flightId: "",
  class: "economy",
  basePrice: "",
  availableSeats: "",
  isRefundable: false,
  isChangeable: true,
};

function formatMoney(value?: number) {
  return `₽${Number(value || 0).toLocaleString("ru-RU")}`;
}

function toApiDateTime(value: string) {
  return value ? value.replace("T", " ") + ":00" : "";
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bookingBadge(status: string) {
  const paid = ["confirmed", "checked_in", "completed"].includes(status);
  const failed = ["cancelled", "refunded"].includes(status);
  const cls = paid
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : failed
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {bookingStatusLabels[status] ?? status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stats");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFlight, setIsSavingFlight] = useState(false);
  const [isSavingFare, setIsSavingFare] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageOccupancy: 0,
  });
  const [topRoutes, setTopRoutes] = useState<{ route: string; bookings: number }[]>([]);
  const [flights, setFlights] = useState<FlightRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [airports, setAirports] = useState<AirportRow[]>([]);
  const [aircrafts, setAircrafts] = useState<AircraftRow[]>([]);
  const [flightStatuses, setFlightStatuses] = useState<Record<string, string>>({});
  const [flightForm, setFlightForm] = useState(emptyFlightForm);
  const [fareForm, setFareForm] = useState(emptyFareForm);

  const loadDashboard = async () => {
    const [statsData, flightsData, bookingsData, airportsData, aircraftsData] = await Promise.all([
      apiClient.get<DashboardStats>("/dashboard/statistics", true),
      apiClient.get<{ data: FlightRow[] }>("/flights?limit=50"),
      apiClient.get<BookingRow[]>("/bookings", true),
      apiClient.get<AirportRow[]>("/airports"),
      apiClient.get<AircraftRow[]>("/aircrafts", true),
    ]);

    setStats({
      totalFlights: statsData.totalFlights ?? 0,
      totalBookings: statsData.totalBookings ?? 0,
      totalRevenue: statsData.totalRevenue ?? 0,
      averageOccupancy: statsData.averageOccupancy ?? 0,
    });
    setTopRoutes(statsData.topRoutes ?? []);
    setFlights(flightsData.data ?? []);
    setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    setAirports(airportsData ?? []);
    setAircrafts(aircraftsData ?? []);

    const statusMap: Record<string, string> = {};
    (flightsData.data ?? []).forEach((flight) => {
      statusMap[flight.id] = flight.status;
    });
    setFlightStatuses(statusMap);
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || (user.role !== "employee" && user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }

    loadDashboard()
      .catch(() => setError("Не удалось загрузить данные панели управления"))
      .finally(() => setIsLoading(false));
  }, [router]);

  const fares = useMemo(() => {
    return flights.flatMap((flight) =>
      (flight.fares ?? []).map((fare) => ({
        ...fare,
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        route: `${flight.origin?.code ?? "?"} → ${flight.destination?.code ?? "?"}`,
      }))
    );
  }, [flights]);

  const recentBookings = bookings.slice(0, 8);
  const recentFlights = flights.slice(0, 8);

  const handleStatusChange = async (flight: FlightRow, status: string) => {
    const previous = flightStatuses[flight.id] ?? flight.status;
    setFlightStatuses((prev) => ({ ...prev, [flight.id]: status }));
    setError("");
    setSuccess("");

    try {
      await apiClient.patch(`/flights/${flight.id}/status`, { status }, true);
      setFlights((prev) =>
        prev.map((item) => (item.id === flight.id ? { ...item, status } : item))
      );
      setSuccess(`Статус рейса ${flight.flightNumber} обновлён`);
    } catch (err) {
      setFlightStatuses((prev) => ({ ...prev, [flight.id]: previous }));
      setError(err instanceof Error ? err.message : "Не удалось обновить статус рейса");
    }
  };

  const handleCreateFlight = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (flightForm.originAirportId === flightForm.destinationAirportId) {
      setError("Аэропорты отправления и прибытия должны отличаться");
      return;
    }

    setIsSavingFlight(true);
    try {
      const created = await apiClient.post<FlightRow>(
        "/flights",
        {
          flightNumber: flightForm.flightNumber.trim(),
          aircraftId: flightForm.aircraftId,
          originAirportId: flightForm.originAirportId,
          destinationAirportId: flightForm.destinationAirportId,
          scheduledDeparture: toApiDateTime(flightForm.scheduledDeparture),
          scheduledArrival: toApiDateTime(flightForm.scheduledArrival),
          gate: flightForm.gate.trim() || undefined,
          terminal: flightForm.terminal.trim() || undefined,
        },
        true
      );
      setFlights((prev) => [created, ...prev]);
      setFlightStatuses((prev) => ({ ...prev, [created.id]: created.status }));
      setFareForm((prev) => ({ ...prev, flightId: created.id }));
      setFlightForm(emptyFlightForm);
      setSuccess(`Рейс ${created.flightNumber} создан`);
      setActiveTab("flights");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать рейс");
    } finally {
      setIsSavingFlight(false);
    }
  };

  const handleCreateFare = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSavingFare(true);

    try {
      const created = await apiClient.post<FareRow>(
        "/fares",
        {
          flightId: fareForm.flightId,
          class: fareForm.class,
          basePrice: Number(fareForm.basePrice),
          availableSeats: Number(fareForm.availableSeats),
          isRefundable: fareForm.isRefundable,
          isChangeable: fareForm.isChangeable,
        },
        true
      );

      setFlights((prev) =>
        prev.map((flight) =>
          flight.id === fareForm.flightId
            ? { ...flight, fares: [...(flight.fares ?? []), created] }
            : flight
        )
      );
      setFareForm({ ...emptyFareForm, flightId: fareForm.flightId });
      setSuccess("Тариф сохранён");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить тариф");
    } finally {
      setIsSavingFare(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-72 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
              Рабочее место сотрудника
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Панель управления SkyBooker
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Доступ: сотрудник
          </div>
        </div>

        {error && <Message tone="error">{error}</Message>}
        {success && <Message tone="success">{success}</Message>}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 flex flex-wrap gap-2 sticky top-24 z-30 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "stats" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard icon={<Plane className="w-6 h-6" />} title="Всего рейсов" value={stats.totalFlights.toLocaleString("ru-RU")} tone="blue" />
              <MetricCard icon={<Ticket className="w-6 h-6" />} title="Бронирований" value={stats.totalBookings.toLocaleString("ru-RU")} tone="emerald" />
              <MetricCard icon={<CreditCard className="w-6 h-6" />} title="Выручка" value={formatMoney(stats.totalRevenue)} tone="amber" />
              <MetricCard icon={<Users className="w-6 h-6" />} title="Средняя загрузка" value={`${stats.averageOccupancy.toFixed(1)}%`} tone="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Популярные маршруты</h2>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-4">
                  {(topRoutes.length ? topRoutes : [{ route: "SVO → LED", bookings: 0 }]).map((route, index) => {
                    const max = Math.max(1, topRoutes[0]?.bookings ?? route.bookings);
                    const width = Math.max(8, Math.round((route.bookings / max) * 100));
                    return (
                      <div key={`${route.route}-${index}`} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">{route.route}</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">{route.bookings}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Последние заказы</h2>
                <div className="space-y-3">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{booking.pnr}</span>
                        {bookingBadge(booking.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {booking.flight?.origin?.code} → {booking.flight?.destination?.code}
                      </p>
                    </div>
                  ))}
                  {recentBookings.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Бронирования пока не найдены</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "flights" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <SectionHeader title="Управление рейсами" subtitle="Просмотр расписания и изменение статусов рейсов" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400">
                      <tr>
                        <Th>Рейс</Th>
                        <Th>Маршрут</Th>
                        <Th>Самолёт</Th>
                        <Th>Вылет</Th>
                        <Th>Места</Th>
                        <Th>Статус</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {recentFlights.map((flight) => (
                        <tr key={flight.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <Td><span className="font-mono font-bold text-gray-900 dark:text-white">{flight.flightNumber}</span></Td>
                          <Td>{flight.origin?.code} → {flight.destination?.code}</Td>
                          <Td>{flight.aircraft?.model ?? "—"}</Td>
                          <Td>{formatDateTime(flight.scheduledDeparture)}</Td>
                          <Td>{flight.availableSeats}</Td>
                          <Td>
                            <select
                              value={flightStatuses[flight.id] ?? flight.status}
                              onChange={(e) => handleStatusChange(flight, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="scheduled">По расписанию</option>
                              <option value="delayed">Задержан</option>
                              <option value="cancelled">Отменён</option>
                            </select>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <form onSubmit={handleCreateFlight} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <FormTitle icon={<Plus className="w-5 h-5" />} title="Создание рейса" subtitle="Данные сохраняются в расписании" tone="blue" />
                <div className="space-y-3">
                  <TextField label="Номер рейса" value={flightForm.flightNumber} onChange={(value) => setFlightForm((prev) => ({ ...prev, flightNumber: value }))} placeholder="SB 245" required />
                  <SelectField label="Аэропорт отправления" value={flightForm.originAirportId} onChange={(value) => setFlightForm((prev) => ({ ...prev, originAirportId: value }))} required>
                    <option value="">Выберите аэропорт</option>
                    {airports.map((airport) => (
                      <option key={airport.id} value={airport.id}>{airport.code} · {airport.city}</option>
                    ))}
                  </SelectField>
                  <SelectField label="Аэропорт прибытия" value={flightForm.destinationAirportId} onChange={(value) => setFlightForm((prev) => ({ ...prev, destinationAirportId: value }))} required>
                    <option value="">Выберите аэропорт</option>
                    {airports.map((airport) => (
                      <option key={airport.id} value={airport.id}>{airport.code} · {airport.city}</option>
                    ))}
                  </SelectField>
                  <SelectField label="Воздушное судно" value={flightForm.aircraftId} onChange={(value) => setFlightForm((prev) => ({ ...prev, aircraftId: value }))} required>
                    <option value="">Выберите самолёт</option>
                    {aircrafts.map((aircraft) => (
                      <option key={aircraft.id} value={aircraft.id}>{aircraft.model} · {aircraft.registrationNumber}</option>
                    ))}
                  </SelectField>
                  <TextField label="Дата и время вылета" type="datetime-local" value={flightForm.scheduledDeparture} onChange={(value) => setFlightForm((prev) => ({ ...prev, scheduledDeparture: value }))} required />
                  <TextField label="Дата и время прилёта" type="datetime-local" value={flightForm.scheduledArrival} onChange={(value) => setFlightForm((prev) => ({ ...prev, scheduledArrival: value }))} required />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Гейт" value={flightForm.gate} onChange={(value) => setFlightForm((prev) => ({ ...prev, gate: value }))} placeholder="A12" />
                    <TextField label="Терминал" value={flightForm.terminal} onChange={(value) => setFlightForm((prev) => ({ ...prev, terminal: value }))} placeholder="B" />
                  </div>
                  <Button type="submit" disabled={isSavingFlight} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isSavingFlight ? "Добавляем..." : "Добавить рейс"}
                  </Button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === "fares" && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <SectionHeader title="Управление тарифами" subtitle="Классы обслуживания, стоимость, места и условия тарифа" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400">
                    <tr>
                      <Th>Рейс</Th>
                      <Th>Маршрут</Th>
                      <Th>Класс</Th>
                      <Th>Стоимость</Th>
                      <Th>Места</Th>
                      <Th>Возврат</Th>
                      <Th>Изменение</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {fares.slice(0, 12).map((fare) => (
                      <tr key={fare.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <Td><span className="font-mono font-bold">{fare.flightNumber}</span></Td>
                        <Td>{fare.route}</Td>
                        <Td>{fareLabels[fare.class] ?? fare.class}</Td>
                        <Td><span className="font-bold text-blue-600 dark:text-blue-400">{formatMoney(fare.price)}</span></Td>
                        <Td>{fare.availableSeats}</Td>
                        <Td>{fare.isRefundable ? "Да" : "Нет"}</Td>
                        <Td>{fare.isChangeable ? "Да" : "Нет"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleCreateFare} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <FormTitle icon={<Settings2 className="w-5 h-5" />} title="Новый тариф" subtitle="Тариф будет доступен в поиске" tone="amber" />
              <div className="space-y-3">
                <SelectField label="Рейс" value={fareForm.flightId} onChange={(value) => setFareForm((prev) => ({ ...prev, flightId: value }))} required>
                  <option value="">Выберите рейс</option>
                  {flights.map((flight) => (
                    <option key={flight.id} value={flight.id}>
                      {flight.flightNumber} · {flight.origin?.code} → {flight.destination?.code}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Класс обслуживания" value={fareForm.class} onChange={(value) => setFareForm((prev) => ({ ...prev, class: value }))} required>
                  <option value="economy">Эконом</option>
                  <option value="comfort">Комфорт</option>
                  <option value="business">Бизнес</option>
                  <option value="first">Первый</option>
                </SelectField>
                <TextField label="Стоимость" type="number" min="0" value={fareForm.basePrice} onChange={(value) => setFareForm((prev) => ({ ...prev, basePrice: value }))} placeholder="7500" required />
                <TextField label="Количество мест" type="number" min="1" value={fareForm.availableSeats} onChange={(value) => setFareForm((prev) => ({ ...prev, availableSeats: value }))} placeholder="120" required />
                <CheckField label="Разрешён обмен билета" checked={fareForm.isChangeable} onChange={(checked) => setFareForm((prev) => ({ ...prev, isChangeable: checked }))} />
                <CheckField label="Возвратный тариф" checked={fareForm.isRefundable} onChange={(checked) => setFareForm((prev) => ({ ...prev, isRefundable: checked }))} />
                <Button type="submit" disabled={isSavingFare} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {isSavingFare ? "Сохраняем..." : "Сохранить тариф"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {activeTab === "bookings" && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <SectionHeader title="Бронирования пользователей" subtitle="Контроль заказов, оплат и итоговой стоимости" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400">
                  <tr>
                    <Th>PNR</Th>
                    <Th>Пассажир</Th>
                    <Th>Рейс</Th>
                    <Th>Маршрут</Th>
                    <Th>Тариф</Th>
                    <Th>Оплата</Th>
                    <Th>Стоимость</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <Td><span className="font-mono font-bold text-gray-900 dark:text-white">{booking.pnr}</span></Td>
                      <Td>Клиент #{String(booking.id).slice(0, 6)}</Td>
                      <Td>{booking.flight?.flightNumber ?? "—"}</Td>
                      <Td>{booking.flight?.origin?.code} → {booking.flight?.destination?.code}</Td>
                      <Td>{booking.fare?.class ? fareLabels[booking.fare.class] : "По выбранному тарифу"}</Td>
                      <Td>{bookingBadge(booking.status)}</Td>
                      <Td><span className="font-bold text-blue-600 dark:text-blue-400">{formatMoney(booking.totalAmount)}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings.length === 0 && (
              <p className="text-center py-10 text-gray-500 dark:text-gray-400">Бронирования не найдены</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Message({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const isError = tone === "error";
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${
      isError
        ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
    }`}>
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
      )}
      <p className={`text-sm ${isError ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
        {children}
      </p>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        <CheckCircle className="w-5 h-5 text-emerald-500" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
      <Route className="w-5 h-5 text-blue-500 flex-shrink-0" />
    </div>
  );
}

function FormTitle({
  icon,
  title,
  subtitle,
  tone,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone: "blue" | "amber";
}) {
  const colors = tone === "blue"
    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
    : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400";

  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{children}</td>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        className="rounded border-gray-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
