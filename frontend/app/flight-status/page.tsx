"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plane,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(dep: string, arr: string) {
  const diff = Math.round(
    (new Date(arr).getTime() - new Date(dep).getTime()) / 60000
  );
  return `${Math.floor(diff / 60)}ч ${diff % 60}м`;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  scheduled: {
    icon: <Clock className="w-5 h-5" />,
    label: "По расписанию",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
  delayed: {
    icon: <AlertCircle className="w-5 h-5" />,
    label: "Задержан",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  },
  cancelled: {
    icon: <XCircle className="w-5 h-5" />,
    label: "Отменён",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
}

export default function FlightSchedulePage() {
  const [flightNumber, setFlightNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFlightInfo(null);
    setIsLoading(true);

    try {
      const data = await apiClient.get<{ data: any[]; pagination: any }>(
        "/flights?limit=200"
      );

      const needle = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
      let results = (data.data ?? []).filter(
        (f: any) =>
          f.flightNumber.toUpperCase().replace(/\s+/g, "") === needle
      );

      if (searchDate) {
        results = results.filter((f: any) =>
          f.scheduledDeparture.startsWith(searchDate)
        );
      }

      if (results.length === 0) {
        setError(
          searchDate
            ? `Рейс «${flightNumber}» на ${new Date(searchDate).toLocaleDateString("ru-RU")} не найден`
            : `Рейс «${flightNumber}» не найден`
        );
        return;
      }

      const found = results[0];
      setFlightInfo(found);
    } catch {
      setError("Ошибка при поиске рейса. Проверьте, что бэкенд запущен.");
    } finally {
      setIsLoading(false);
    }
  };

  const status = flightInfo ? getStatusConfig(flightInfo.status) : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Расписание рейсов
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Проверьте статус рейса: запланирован, задержан или отменён
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg mb-8 border border-white/20 dark:border-gray-700/20">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Номер рейса *
                </label>
                <div className="relative">
                  <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="SU1234"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата вылета (опционально)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {isLoading ? "Поиск..." : "Найти рейс"}
            </Button>
          </form>
        </div>

        {/* Flight Info */}
        {flightInfo && status && (
          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden border border-white/20 dark:border-gray-700/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-800 dark:to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wide mb-1">Рейс</p>
                  <p className="text-3xl font-bold">{flightInfo.flightNumber}</p>
                  <p className="text-sm opacity-80 mt-1">
                    {flightInfo.aircraft?.model ?? "—"} · {flightInfo.aircraft?.registrationNumber ?? ""}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${status.color}`}>
                  {status.icon}
                  <span className="font-semibold">{status.label}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              {/* Route */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Откуда</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {flightInfo.origin?.code}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{flightInfo.origin?.city}</p>
                </div>
                <div className="text-center px-4">
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-gray-300 dark:bg-gray-600" />
                    <Plane className="w-5 h-5 text-blue-500" />
                    <div className="h-px w-8 bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtDuration(flightInfo.scheduledDeparture, flightInfo.scheduledArrival)}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Куда</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {flightInfo.destination?.code}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{flightInfo.destination?.city}</p>
                </div>
              </div>

              {/* Schedule table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Вылет</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Аэропорт</p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                    {flightInfo.origin?.name} ({flightInfo.origin?.city})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Дата и время</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {fmtTime(flightInfo.scheduledDeparture)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fmtDate(flightInfo.scheduledDeparture)}
                  </p>
                  {flightInfo.terminal && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Терминал: <span className="font-semibold">{flightInfo.terminal}</span>
                    </p>
                  )}
                  {flightInfo.gate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Выход: <span className="font-semibold">{flightInfo.gate}</span>
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Прилёт</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Аэропорт</p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                    {flightInfo.destination?.name} ({flightInfo.destination?.city})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Дата и время</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {fmtTime(flightInfo.scheduledArrival)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fmtDate(flightInfo.scheduledArrival)}
                  </p>
                </div>
              </div>

              {/* Status message */}
              {flightInfo.status === "delayed" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                    Рейс задержан. Следите за обновлениями на табло аэропорта.
                  </p>
                </div>
              )}
              {flightInfo.status === "cancelled" && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    Рейс отменён. Обратитесь в службу поддержки для возврата или переноса.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Рекомендуем:</strong> Прибывайте в аэропорт за 2 часа до вылета
                  для внутренних рейсов.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!flightInfo && !isLoading && !error && (
          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-12 text-center shadow-lg border border-white/20 dark:border-gray-700/20">
            <Plane className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Введите номер рейса
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Укажите номер рейса, чтобы проверить его статус в расписании
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
