"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Flight, Fare } from "@/types";
import { apiClient } from "@/lib/api/client";
import {
  Plane,
  Clock,
  Filter,
  Luggage,
  ArrowRight,
  ArrowLeftRight,
  SlidersHorizontal,
  X,
  Users,
  Search,
  BarChart2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function fmtDuration(min: number) {
  return `${Math.floor(min / 60)}ч ${min % 60}м`;
}

const PRICE_MAX = 80000;
const PRICE_MIN = 1000;

const AIRLINE_MAP: Record<string, string> = {
  SU: "Аэрофлот",
  S7: "S7 Airlines",
  UT: "Utair",
  U6: "Уральские авиалинии",
  DP: "Победа",
  FV: "Россия",
  N4: "Норд Винд",
  PC: "Pegasus",
};

function getAirlineName(flightNumber: string): string {
  const code = flightNumber.match(/^([A-Z][A-Z0-9])/)?.[1] ?? "";
  return AIRLINE_MAP[code] || flightNumber.replace(/[0-9].*/g, "").trim() || "Неизвестно";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Map backend FlightDTO → frontend Flight + build fares dict
function mapFlightDTO(dto: any): Flight {
  return {
    id: dto.id,
    flightNumber: dto.flightNumber,
    airline: getAirlineName(dto.flightNumber),
    airlineCode: dto.flightNumber.match(/^([A-Z][A-Z0-9])/)?.[1] ?? "",
    origin: dto.origin?.city ?? "",
    originCode: dto.origin?.code ?? "",
    destination: dto.destination?.city ?? "",
    destinationCode: dto.destination?.code ?? "",
    departureTime: dto.scheduledDeparture,
    arrivalTime: dto.scheduledArrival,
    duration: dto.duration ?? 0,
    aircraftType: dto.aircraft?.model ?? "Неизвестно",
    availableSeats: dto.availableSeats ?? 0,
    stops: 0,
  };
}

function mapFaresDTO(flightId: string, dtoFares: any[]): Fare[] {
  return (dtoFares ?? []).map((f: any) => ({
    id: f.id,
    flightId,
    type: capitalize(f.class) as Fare["type"],
    price: f.price,
    currency: f.currency ?? "RUB",
    baggage: f.baggage ?? { cabin: "10 кг", checked: "нет" },
    refundable: f.isRefundable ?? false,
    changeable: f.isChangeable ?? true,
    features: f.features ?? [],
  }));
}

type SortKey =
  | "price_asc"
  | "price_desc"
  | "duration_asc"
  | "departure_asc"
  | "departure_desc";

const selectCls =
  "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer";

// ─── component ───────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const [origin, setOrigin] = useState(sp.get("origin") ?? "");
  const [destination, setDestination] = useState(sp.get("destination") ?? "");
  const [date, setDate] = useState(sp.get("date") ?? "");
  const [passengers, setPassengers] = useState(Number(sp.get("passengers") ?? 1));
  const query = sp.get("q") ?? "";

  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [airline, setAirline] = useState("all");
  const [stops, setStops] = useState("all");
  const [departureTime, setDepartureTime] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");
  const [fareClass, setFareClass] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (flightId: string) => {
    setCompareList((prev) => {
      if (prev.includes(flightId)) return prev.filter((id) => id !== flightId);
      if (prev.length >= 3) return prev;
      return [...prev, flightId];
    });
  };

  // Dynamic cities from flights
  const [dynamicCities, setDynamicCities] = useState<{ city: string; code: string }[]>([]);

  // API data
  const [apiFlights, setApiFlights] = useState<Flight[]>([]);
  const [apiFaresDict, setApiFaresDict] = useState<Record<string, Fare[]>>({});
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [flightsError, setFlightsError] = useState("");

  useEffect(() => {
    setOrigin(sp.get("origin") ?? "");
    setDestination(sp.get("destination") ?? "");
    setDate(sp.get("date") ?? "");
    setPassengers(Number(sp.get("passengers") ?? 1));
  }, [sp]);

  // Load flights from backend (with auto date-refresh)
  useEffect(() => {
    setLoadingFlights(true);
    setFlightsError("");
    // Сначала сдвигаем даты рейсов, затем загружаем
    apiClient
      .get<any>("/flights/refresh-dates")
      .catch(() => {}) // игнорируем ошибку refresh — просто грузим как есть
      .then(() =>
        apiClient.get<{ data: any[]; pagination: any }>("/flights?limit=200")
      )
      .then((res: any) => {
        const data = res?.data ?? [];
        const mapped = data.map(mapFlightDTO);
        const faresDict: Record<string, Fare[]> = {};
        data.forEach((dto: any) => {
          faresDict[dto.id] = mapFaresDTO(dto.id, dto.fares ?? []);
        });
        setApiFlights(mapped);
        setApiFaresDict(faresDict);
      })
      .catch(() => {
        setFlightsError("Не удалось загрузить рейсы. Проверьте, что бэкенд запущен.");
      })
      .finally(() => setLoadingFlights(false));
  }, []);

  // Extract unique cities from loaded flights
  useEffect(() => {
    if (apiFlights.length === 0) return;
    const cityMap = new Map<string, string>();
    apiFlights.forEach((f) => {
      if (f.origin && f.originCode) cityMap.set(f.origin, f.originCode);
      if (f.destination && f.destinationCode) cityMap.set(f.destination, f.destinationCode);
    });
    const sorted = Array.from(cityMap.entries())
      .map(([city, code]) => ({ city, code }))
      .sort((a, b) => a.city.localeCompare(b.city, "ru"));
    setDynamicCities(sorted);
  }, [apiFlights]);

  const getMinFlightPrice = (flightId: string): number => {
    const fares = apiFaresDict[flightId] ?? [];
    if (!fares.length) return 0;
    return Math.min(...fares.map((f) => f.price));
  };

  const allAirlines = useMemo(
    () => Array.from(new Set(apiFlights.map((f) => f.airline))).sort(),
    [apiFlights]
  );

  const flights = useMemo(() => {
    // Only show flights that have at least one fare
    let result = apiFlights.filter((f) => (apiFaresDict[f.id] ?? []).length > 0);

    if (origin) {
      result = result.filter((f) =>
        f.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    if (destination) {
      result = result.filter((f) =>
        f.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    // Фильтр по дате вылета
    if (date) {
      result = result.filter((f) => {
        // Сравниваем первые 10 символов ISO-строки (YYYY-MM-DD)
        const flightDate = f.departureTime.slice(0, 10);
        return flightDate === date;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.origin.toLowerCase().includes(q) ||
          f.destination.toLowerCase().includes(q) ||
          f.airline.toLowerCase().includes(q) ||
          f.flightNumber.toLowerCase().includes(q)
      );
    }

    if (airline !== "all") {
      result = result.filter((f) => f.airline === airline);
    }

    if (stops !== "all") {
      if (stops === "2+") {
        result = result.filter((f) => f.stops >= 2);
      } else {
        result = result.filter((f) => f.stops === Number(stops));
      }
    }

    if (departureTime !== "all") {
      result = result.filter((f) => {
        const h = new Date(f.departureTime).getUTCHours();
        switch (departureTime) {
          case "night":     return h >= 0 && h < 6;
          case "morning":   return h >= 6 && h < 12;
          case "afternoon": return h >= 12 && h < 18;
          case "evening":   return h >= 18 && h < 24;
          default: return true;
        }
      });
    }

    result = result.filter((f) => {
      const p = getMinFlightPrice(f.id);
      return p >= minPrice && p <= maxPrice;
    });

    if (fareClass !== "all") {
      result = result.filter((f) => {
        const fares = apiFaresDict[f.id] ?? [];
        return fares.some((fare) => fare.type === fareClass);
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return getMinFlightPrice(a.id) - getMinFlightPrice(b.id);
        case "price_desc":
          return getMinFlightPrice(b.id) - getMinFlightPrice(a.id);
        case "duration_asc":
          return a.duration - b.duration;
        case "departure_asc":
          return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        case "departure_desc":
          return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [
    apiFlights,
    apiFaresDict,
    origin,
    destination,
    date,
    query,
    airline,
    stops,
    departureTime,
    minPrice,
    maxPrice,
    fareClass,
    sortBy,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date);
    params.set("passengers", String(passengers));
    router.push(`/search?${params.toString()}`);
  };

  const swapCities = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const resetFilters = () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setAirline("all");
    setStops("all");
    setDepartureTime("all");
    setSortBy("price_asc");
    setFareClass("all");
    setOrigin("");
    setDestination("");
    setDate("");
    setPassengers(1);
    // Clear URL params without causing remount
    window.history.replaceState(null, "", "/search");
  };

  const hasActiveFilters =
    minPrice > PRICE_MIN ||
    maxPrice < PRICE_MAX ||
    airline !== "all" ||
    stops !== "all" ||
    departureTime !== "all" ||
    fareClass !== "all";

  const sliderCls =
    "w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400 bg-gray-200 dark:bg-gray-600";

  const Sidebar = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden sticky top-24">
      {/* Цветная шапка */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white/80" />
          <span className="font-semibold text-white text-sm tracking-wide">Фильтры</span>
          {hasActiveFilters && (
            <span className="bg-white/20 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">!</span>
          )}
        </div>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" />Сбросить
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Сортировка</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className={selectCls}>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
            <option value="duration_asc">Время в пути: короче</option>
            <option value="departure_asc">Вылет: раньше</option>
            <option value="departure_desc">Вылет: позже</option>
          </select>
        </div>

        {/* Цена — два отдельных слайдера */}
        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">Цена</label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">От</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                  {minPrice.toLocaleString()} ₽
                </span>
              </div>
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={500}
                value={minPrice}
                onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 500))}
                className={sliderCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">До</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                  {maxPrice.toLocaleString()} ₽
                </span>
              </div>
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 500))}
                className={sliderCls}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Авиакомпания</label>
          <select value={airline} onChange={(e) => setAirline(e.target.value)} className={selectCls}>
            <option value="all">Все авиакомпании</option>
            {allAirlines.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Пересадки</label>
          <select value={stops} onChange={(e) => setStops(e.target.value)} className={selectCls}>
            <option value="all">Любые</option>
            <option value="0">Прямые</option>
            <option value="1">1 пересадка</option>
            <option value="2+">2 и более</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Время вылета</label>
          <select value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className={selectCls}>
            <option value="all">Любое</option>
            <option value="night">Ночь (00:00–06:00)</option>
            <option value="morning">Утро (06:00–12:00)</option>
            <option value="afternoon">День (12:00–18:00)</option>
            <option value="evening">Вечер (18:00–00:00)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Класс тарифа</label>
          <select value={fareClass} onChange={(e) => setFareClass(e.target.value)} className={selectCls}>
            <option value="all">Все классы</option>
            <option value="Economy">Эконом</option>
            <option value="Comfort">Комфорт</option>
            <option value="Business">Бизнес</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-md">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-white/80 mb-1 uppercase tracking-wide font-medium">Откуда</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={selectCls}>
              <option value="">Любой</option>
              {dynamicCities.map((c) => (<option key={c.code} value={c.city}>{c.city}</option>))}
            </select>
          </div>

          <button type="button" onClick={swapCities}
            className="mb-0.5 p-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all self-end"
            title="Поменять">
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-white/80 mb-1 uppercase tracking-wide font-medium">Куда</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className={selectCls}>
              <option value="">Любой</option>
              {dynamicCities.filter((c) => c.city !== origin).map((c) => (<option key={c.code} value={c.city}>{c.city}</option>))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-xs text-white/80 mb-1 uppercase tracking-wide font-medium">Дата</label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Любая дата"
              min={new Date().toISOString().split("T")[0]}
              className="border-white/30 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          <div className="min-w-[110px]">
            <label className="block text-xs text-white/80 mb-1 uppercase tracking-wide font-medium">Пассажиры</label>
            <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className={selectCls}>
              {[1, 2, 3, 4, 5, 6].map((n) => (<option key={n} value={n}>{n} чел.</option>))}
            </select>
          </div>

          <Button type="submit" className="bg-white hover:bg-gray-50 text-blue-700 font-semibold px-5 py-2 h-[38px] flex items-center gap-2 rounded-lg self-end text-sm shadow-md">
            <Search className="w-4 h-4" />Найти
          </Button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="inline-block w-1 h-5 bg-blue-600 rounded-full" />
              {query ? `Поиск: «${query}»` : origin || destination ? `${origin || "—"} → ${destination || "—"}` : "Все рейсы"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loadingFlights ? "Загрузка рейсов..." : (
                <>Найдено: <span className="font-semibold text-gray-700 dark:text-gray-200">{flights.length}</span>{" "}
                {flights.length === 1 ? "рейс" : flights.length < 5 ? "рейса" : "рейсов"}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {compareList.length >= 2 && (
              <Button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                <BarChart2 className="w-4 h-4" />
                Сравнить ({compareList.length})
              </Button>
            )}
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200">
              <Filter className="w-4 h-4" />Фильтры
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Compare Modal */}
        {showCompare && (
          <CompareModal
            flights={flights.filter((f) => compareList.includes(f.id))}
            faresDict={apiFaresDict}
            onClose={() => setShowCompare(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className={`lg:col-span-1 ${filtersOpen ? "block" : "hidden lg:block"}`}>
            <Sidebar />
          </aside>

          <main className="lg:col-span-3 space-y-3">
            {loadingFlights ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700/50">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Загружаем рейсы...</p>
              </div>
            ) : flightsError ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-red-200 dark:border-red-800/50">
                <p className="text-red-600 dark:text-red-400 font-medium">{flightsError}</p>
              </div>
            ) : flights.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700/50">
                <Plane className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Рейсы не найдены</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Попробуйте изменить параметры поиска или сбросить фильтры</p>
                <button onClick={resetFilters} className="mt-4 text-blue-600 dark:text-blue-400 text-sm hover:underline">Сбросить фильтры</button>
              </div>
            ) : (
              flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  fares={apiFaresDict[flight.id] ?? []}
                  isSelected={selectedFlight === flight.id}
                  onToggle={() => setSelectedFlight(selectedFlight === flight.id ? null : flight.id)}
                  fareClassFilter={fareClass}
                  isInCompare={compareList.includes(flight.id)}
                  onCompareToggle={() => toggleCompare(flight.id)}
                  compareDisabled={!compareList.includes(flight.id) && compareList.length >= 3}
                />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── CompareModal ─────────────────────────────────────────────────────────────

function CompareModal({
  flights,
  faresDict,
  onClose,
}: {
  flights: Flight[];
  faresDict: Record<string, Fare[]>;
  onClose: () => void;
}) {
  const getFare = (flightId: string, type: string) =>
    (faresDict[flightId] ?? []).find((f) => f.type.toLowerCase() === type);

  const rows = [
    { label: "Рейс", render: (f: Flight) => <span className="font-mono font-bold">{f.flightNumber}</span> },
    { label: "Вылет", render: (f: Flight) => fmtTime(f.departureTime) },
    { label: "Прилёт", render: (f: Flight) => fmtTime(f.arrivalTime) },
    { label: "Длительность", render: (f: Flight) => fmtDuration(f.duration) },
    {
      label: "Цена (Эконом)",
      render: (f: Flight) => {
        const fare = getFare(f.id, "economy");
        return fare ? <span className="text-blue-600 dark:text-blue-400 font-bold">{fare.price.toLocaleString()} ₽</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      label: "Цена (Бизнес)",
      render: (f: Flight) => {
        const fare = getFare(f.id, "business");
        return fare ? <span className="text-amber-600 dark:text-amber-400 font-bold">{fare.price.toLocaleString()} ₽</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      label: "Норма багажа",
      render: (f: Flight) => {
        const fare = (faresDict[f.id] ?? [])[0];
        if (!fare) return <span className="text-gray-400">—</span>;
        return <span>{fare.baggage.cabin} / {fare.baggage.checked}</span>;
      },
    },
    {
      label: "Возврат",
      render: (f: Flight) => {
        const fares = faresDict[f.id] ?? [];
        const refundable = fares.some((fa) => fa.refundable);
        return refundable
          ? <span className="text-green-600 dark:text-green-400">✓ Есть</span>
          : <span className="text-red-500 dark:text-red-400">✗ Нет</span>;
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Сравнение рейсов</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-gray-500 dark:text-gray-400 font-medium pb-4 pr-4 w-32">Параметр</th>
                {flights.map((f) => (
                  <th key={f.id} className="text-center pb-4 px-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="font-bold text-gray-900 dark:text-white text-base">{f.flightNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.airline}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{f.originCode} → {f.destinationCode}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{row.label}</td>
                  {flights.map((f) => (
                    <td key={f.id} className="py-3 px-4 text-center text-gray-800 dark:text-gray-200">
                      {row.render(f)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-gray-100 dark:border-gray-700">
                <td className="pt-4" />
                {flights.map((f) => {
                  const cheapestFare = (faresDict[f.id] ?? [])[0];
                  return (
                    <td key={f.id} className="pt-4 px-4 text-center">
                      {cheapestFare ? (
                        <Link href={`/booking?flightId=${f.id}&fareId=${cheapestFare.id}`}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                            Забронировать
                          </Button>
                        </Link>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── FlightCard ───────────────────────────────────────────────────────────────

function FlightCard({
  flight,
  fares,
  isSelected,
  onToggle,
  isInCompare,
  onCompareToggle,
  compareDisabled,
}: {
  flight: Flight;
  fares: Fare[];
  isSelected: boolean;
  onToggle: () => void;
  fareClassFilter?: string;
  isInCompare: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
}) {
  const visibleFares = fares;
  const minPrice = fares.length > 0 ? Math.min(...fares.map((f) => f.price)) : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
      isInCompare ? "border-green-400 dark:border-green-600" : "border-gray-100 dark:border-gray-700/50"
    }`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{flight.airline}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{flight.flightNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCompareToggle}
              disabled={compareDisabled}
              title={compareDisabled ? "Максимум 3 рейса для сравнения" : isInCompare ? "Убрать из сравнения" : "Добавить для сравнения"}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isInCompare
                  ? "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600"
              }`}
            >
              {isInCompare ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              Сравнить
            </button>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">от</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {minPrice > 0 ? `${minPrice.toLocaleString()} ₽` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{fmtTime(flight.departureTime)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{flight.origin}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{flight.originCode}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(flight.departureTime)}</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium">{fmtDuration(flight.duration)}</p>
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
              <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {flight.stops === 0 ? "Прямой" : flight.stops === 1 ? "1 пересадка" : `${flight.stops} пересадки`}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{fmtTime(flight.arrivalTime)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{flight.destination}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{flight.destinationCode}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(flight.arrivalTime)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{flight.aircraftType}</span>
            <span>·</span>
            <span>Мест: {flight.availableSeats}</span>
          </div>
          {fares.length > 0 && (
            <Button onClick={onToggle} size="sm"
              className={isSelected
                ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white"}>
              {isSelected ? "Скрыть тарифы" : "Выбрать тариф"}
            </Button>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/40 p-5">
          {visibleFares.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Нет доступных тарифов для выбранного класса
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleFares.map((fare) => (
                <div key={fare.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      fare.type === "Business"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : fare.type === "Comfort"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {fare.type}
                    </span>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {fare.price.toLocaleString()} ₽
                    </p>
                  </div>

                  <div className="space-y-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-start gap-1.5">
                      <Luggage className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{fare.baggage.cabin}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Luggage className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{fare.baggage.checked}</span>
                    </div>
                    {fare.features.map((feat, i) => (
                      <p key={i} className="text-green-600 dark:text-green-400">✓ {feat}</p>
                    ))}
                    <p className={fare.refundable ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                      {fare.refundable ? "✓ Возвратный" : "✗ Невозвратный"}
                    </p>
                  </div>

                  <Link href={`/booking?flightId=${flight.id}&fareId=${fare.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2">
                      Выбрать
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
