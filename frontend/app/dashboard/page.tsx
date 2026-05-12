"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
} from "lucide-react";
import { authService } from "@/lib/services/authService";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    averageOccupancy: 0,
  });
  const [recentFlights, setRecentFlights] = useState<any[]>([]);
  const [topRoutes, setTopRoutes] = useState<{ route: string; bookings: number }[]>([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || (user.role !== "employee" && user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }

    Promise.all([
      apiClient.get<any>("/dashboard/statistics", true),
      apiClient.get<any>("/flights?limit=10"),
    ])
      .then(([statsData, flightsData]) => {
        setStats({
          totalFlights: statsData.totalFlights ?? 0,
          activeFlights: 0,
          totalBookings: statsData.totalBookings ?? 0,
          todayBookings: 0,
          totalRevenue: statsData.totalRevenue ?? 0,
          averageOccupancy: statsData.averageOccupancy ?? 0,
        });
        setTopRoutes(statsData.topRoutes ?? []);

        const flights = (flightsData.data ?? []).map((f: any) => ({
          id: f.flightNumber,
          route: `${f.origin?.code ?? "?"} → ${f.destination?.code ?? "?"}`,
          status: f.status,
          occupancy: 0,
          time: new Date(f.scheduledDeparture).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setRecentFlights(flights);
      })
      .catch(() => {
        // show page with zeros on error
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400",
      delayed:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };

    const labels: Record<string, string> = {
      scheduled: "По расписанию",
      delayed:   "Задержка",
      cancelled: "Отменён",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] ?? styles.scheduled
        }`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Панель управления
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Обзор операций и статистика рейсов
            </p>
          </div>
          <Link href="/dashboard/flights">
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
              Управление рейсами
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Всего рейсов</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalFlights}
            </p>
          </div>

          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Бронирований</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalBookings}
            </p>
          </div>

          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Заполняемость</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.averageOccupancy.toFixed(1)}%
            </p>
          </div>

          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Выручка</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalRevenue >= 1000000
                ? `₽${(stats.totalRevenue / 1000000).toFixed(1)}M`
                : `₽${stats.totalRevenue.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Top-5 Routes */}
        {topRoutes.length > 0 && (
          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Топ-5 маршрутов по бронированиям
            </h2>
            <div className="space-y-3">
              {topRoutes.map((r, i) => {
                const maxBookings = topRoutes[0]?.bookings ?? 1;
                const pct = Math.round((r.bookings / maxBookings) * 100);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-5 text-sm font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.route}</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-3 flex-shrink-0">{r.bookings}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Flights */}
        <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Последние рейсы
            </h2>
            <Link
              href="/dashboard/flights"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Все рейсы →
            </Link>
          </div>

          {recentFlights.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Нет данных о рейсах
            </p>
          ) : (
            <div className="space-y-4">
              {recentFlights.map((flight, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {flight.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {flight.route}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Время</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {flight.time}
                      </p>
                    </div>
                    {getStatusBadge(flight.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
