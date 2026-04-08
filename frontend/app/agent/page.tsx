"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Users, Ticket, Plus } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { apiClient } from "@/lib/api/client";

export default function AgentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== "agent") {
      router.push("/auth/login");
      return;
    }

    apiClient
      .get<any[]>("/bookings", true)
      .then((data) => {
        setRecentBookings(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRecentBookings([]);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const filteredBookings = recentBookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.pnr ?? "").toLowerCase().includes(q) ||
      (b.flight?.flightNumber ?? "").toLowerCase().includes(q)
    );
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":    return "Оплачено";
      case "pending_payment": return "Ожидает оплаты";
      case "cancelled":    return "Отменено";
      case "refunded":     return "Возвращено";
      case "completed":    return "Завершено";
      default: return status;
    }
  };

  const isPaid = (status: string) =>
    status === "confirmed" || status === "completed" || status === "checked_in";

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Рабочее место агента
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Бронирование билетов для клиентов
            </p>
          </div>
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Новое бронирование
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Быстрые действия
              </h2>
              <div className="space-y-3">
                <Link href="/search">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Поиск рейсов
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  База клиентов
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Ticket className="w-4 h-4 mr-2" />
                  Мои бронирования
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Статистика
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Всего бронирований</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentBookings.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Оплачено</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentBookings.filter((b) => isPaid(b.status)).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ожидают оплаты</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {recentBookings.filter((b) => b.status === "pending_payment").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Последние бронирования
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по PNR или рейсу"
                    className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Бронирования не найдены
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            PNR:{" "}
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">
                              {booking.pnr}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isPaid(booking.status)
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : booking.status === "cancelled"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      {booking.flight && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Рейс</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {booking.flight.flightNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Маршрут</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {booking.flight.origin?.code} → {booking.flight.destination?.code}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Дата</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(booking.flight.scheduledDeparture).toLocaleDateString(
                                "ru-RU",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Сумма</p>
                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                              ₽{booking.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          Детали
                        </Button>
                        {booking.status === "pending_payment" && (
                          <Link href="/payment">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Оплатить
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
