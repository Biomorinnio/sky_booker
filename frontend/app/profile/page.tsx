"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plane,
  LogOut,
  Download,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/services/authService";

export default function ProfilePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    setIsLoading(true);
    setError("");
    apiClient
      .get<any[]>("/bookings", true)
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError("Не удалось загрузить бронирования");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    loadBookings();
  }, [router, loadBookings]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Вы уверены, что хотите отменить бронирование? Будет удержана комиссия 10%.")) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await apiClient.delete(`/bookings/${bookingId}`, true);
      loadBookings();
    } catch {
      alert("Не удалось отменить бронирование");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadTicket = (booking: any) => {
    const flight = booking.flight;
    if (!flight) return;

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    const formatTime = (d: string) =>
      new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    const user = authService.getCurrentUser();
    const passengerName = user ? `${user.lastName} ${user.firstName}` : "—";

    const content = [
      "══════════════════════════════════════════════",
      "           ЭЛЕКТРОННЫЙ БИЛЕТ / E-TICKET        ",
      "              SKY BOOKER AIRLINES               ",
      "══════════════════════════════════════════════",
      "",
      `  Код бронирования (PNR):   ${booking.pnr}`,
      `  Статус:                   Подтверждено`,
      "",
      "──────────────────────────────────────────────",
      "  ИНФОРМАЦИЯ О РЕЙСЕ",
      "──────────────────────────────────────────────",
      "",
      `  Рейс:          ${flight.flightNumber}`,
      `  Маршрут:        ${flight.origin?.city ?? flight.origin?.code} (${flight.origin?.code})`,
      `                  → ${flight.destination?.city ?? flight.destination?.code} (${flight.destination?.code})`,
      `  Дата вылета:    ${formatDate(flight.scheduledDeparture)}`,
      `  Время вылета:   ${formatTime(flight.scheduledDeparture)}`,
      `  Время прибытия: ${formatTime(flight.scheduledArrival)}`,
      "",
      "──────────────────────────────────────────────",
      "  ИНФОРМАЦИЯ О ПАССАЖИРЕ",
      "──────────────────────────────────────────────",
      "",
      `  Пассажир:       ${passengerName}`,
      `  Стоимость:      ${booking.totalAmount?.toLocaleString()} ₽`,
      "",
      "──────────────────────────────────────────────",
      "",
      "  Пожалуйста, прибудьте в аэропорт",
      "  не менее чем за 2 часа до вылета.",
      "",
      "  Горячая линия: +7 (800) 555-35-35",
      "  support@skybooker.ru",
      "",
      "══════════════════════════════════════════════",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_${booking.pnr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
      case "paid":
      case "checked_in":
        return {
          label: status === "checked_in" ? "Зарегистрирован" : "Оплачено",
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
        };
      case "pending_payment":
        return {
          label: "Ожидает оплаты",
          icon: <AlertCircle className="w-5 h-5" />,
          color: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
        };
      case "cancelled":
        return {
          label: "Отменено",
          icon: <XCircle className="w-5 h-5" />,
          color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
        };
      case "refunded":
        return {
          label: "Возвращено",
          icon: <XCircle className="w-5 h-5" />,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30",
        };
      case "completed":
        return {
          label: "Завершено",
          icon: <CheckCircle className="w-5 h-5" />,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30",
        };
      default:
        return {
          label: "Неизвестно",
          icon: <AlertCircle className="w-5 h-5" />,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30",
        };
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-6" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Мои бронирования
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управляйте своими бронированиями и просматривайте детали рейсов
            </p>
          </div>
          <button
            onClick={() => {
              authService.logout();
              window.location.href = "/";
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {bookings.length === 0 && !error ? (
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-12 shadow-lg text-center border border-white/20 dark:border-gray-700/20">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                У вас пока нет бронирований
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Начните поиск рейсов и забронируйте свой первый билет
              </p>
              <Link href="/search">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  Найти рейс
                </Button>
              </Link>
            </div>
          ) : (
            bookings.map((booking) => {
              const flight = booking.flight;
              const statusInfo = getStatusInfo(booking.status);

              return (
                <div
                  key={booking.id}
                  className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-white/20 dark:border-gray-700/20"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Код бронирования
                          </p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                            {booking.pnr}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span className="font-semibold">{statusInfo.label}</span>
                      </div>
                    </div>

                    {flight && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-start gap-3">
                          <Plane className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Рейс</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {flight.flightNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Маршрут</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {flight.origin?.city ?? flight.origin?.code} →{" "}
                              {flight.destination?.city ?? flight.destination?.code}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {flight.origin?.code} — {flight.destination?.code}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Дата вылета</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(flight.scheduledDeparture)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTime(flight.scheduledDeparture)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Общая стоимость
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {booking.totalAmount?.toLocaleString()} ₽
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {booking.status === "pending_payment" && (
                          <>
                            <Link href={`/payment?bookingId=${booking.id}`}>
                              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                                Оплатить
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-2"
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                            >
                              <X className="w-4 h-4" />
                              {cancellingId === booking.id ? "Отмена..." : "Отменить"}
                            </Button>
                          </>
                        )}
                        {(booking.status === "confirmed" || booking.status === "paid" || booking.status === "checked_in" || booking.status === "completed") && (
                          <>
                            <Link href={`/ticket/${booking.id}`}>
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                Просмотреть билет
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => handleDownloadTicket(booking)}
                            >
                              <Download className="w-4 h-4" />
                              Скачать билет
                            </Button>
                            {booking.status !== "completed" && (
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-2"
                                onClick={() => handleCancel(booking.id)}
                                disabled={cancellingId === booking.id}
                              >
                                <X className="w-4 h-4" />
                                {cancellingId === booking.id ? "Отмена..." : "Отменить"}
                              </Button>
                            )}
                          </>
                        )}
                        {(booking.status === "cancelled" || booking.status === "refunded") && (
                          <Button variant="outline" disabled>
                            Отменено
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Создано: {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {bookings.length > 0 && (
          <div className="mt-8 bg-liquid-glass bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl rounded-xl p-6 border border-blue-200/20 dark:border-blue-700/20">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">
              Нужна помощь?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
              Если у вас возникли вопросы по бронированию, свяжитесь с нашей службой поддержки
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                +7 (800) 555-35-35
              </Button>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                support@skybooker.ru
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
