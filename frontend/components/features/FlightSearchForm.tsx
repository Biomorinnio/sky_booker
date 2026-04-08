"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeftRight, Calendar, Users } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface CityOption {
  city: string;
  code: string;
}

const selectCls =
  "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer";

export const FlightSearchForm = () => {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cities, setCities] = useState<CityOption[]>([]);
  const dateRef = useRef<HTMLInputElement>(null);

  // Load unique cities from flights API
  useEffect(() => {
    apiClient
      .get<{ data: any[] }>("/flights?limit=100")
      .then((res) => {
        const cityMap = new Map<string, string>();
        (res.data ?? []).forEach((dto: any) => {
          if (dto.origin?.city && dto.origin?.code) {
            cityMap.set(dto.origin.city, dto.origin.code);
          }
          if (dto.destination?.city && dto.destination?.code) {
            cityMap.set(dto.destination.city, dto.destination.code);
          }
        });
        const sorted = Array.from(cityMap.entries())
          .map(([city, code]) => ({ city, code }))
          .sort((a, b) => a.city.localeCompare(b.city, "ru"));
        setCities(sorted);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (destination) params.set("destination", destination);
    if (departureDate) params.set("date", departureDate);
    params.set("passengers", String(passengers));
    router.push(`/search?${params.toString()}`);
  };

  const swapCities = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const openDatePicker = () => {
    try {
      dateRef.current?.showPicker();
    } catch {
      dateRef.current?.focus();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto -mt-20 relative z-20 px-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-5 text-center tracking-tight">
          Поиск авиабилетов
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Origin / Destination */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Откуда
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className={selectCls}
                required
              >
                <option value="">— Выберите город —</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.city}>
                    {c.city} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swapCities}
              className="mb-0.5 p-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-all self-end"
              title="Поменять местами"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Куда
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={selectCls}
                required
              >
                <option value="">— Выберите город —</option>
                {cities.filter((c) => c.city !== origin).map((c) => (
                  <option key={c.code} value={c.city}>
                    {c.city} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date / Passengers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Дата вылета
              </label>
              <div className="relative cursor-pointer" onClick={openDatePicker}>
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={dateRef}
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Пассажиры
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}{" "}
                      {n === 1 ? "пассажир" : n < 5 ? "пассажира" : "пассажиров"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg rounded-xl"
          >
            <Search className="w-5 h-5" />
            Найти рейс
          </Button>
        </form>
      </div>
    </div>
  );
};
