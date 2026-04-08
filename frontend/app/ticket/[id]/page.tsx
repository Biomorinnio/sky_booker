"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plane,
  MapPin,
  Calendar,
  Clock,
  User,
  Ticket,
  Printer,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/services/authService";

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("ru-RU", opts);
}

const CLASS_LABELS: Record<string, string> = {
  economy: "Эконом",
  comfort: "Комфорт",
  business: "Бизнес",
  first: "Первый класс",
};

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    if (!bookingId) return;

    apiClient
      .get<any>(`/bookings/${bookingId}`, true)
      .then((data) => setBooking(data))
      .catch(() => setError("Билет не найден или недоступен"))
      .finally(() => setIsLoading(false));
  }, [bookingId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || "Билет не найден"}</p>
          <Link href="/profile">
            <Button variant="outline">← Мои бронирования</Button>
          </Link>
        </div>
      </div>
    );
  }

  const flight = booking.flight;
  const fare = booking.fare;
  const passenger = booking.passengers?.[0];
  const user = authService.getCurrentUser();

  const ticketNumber = passenger?.ticketNumber ?? "—";
  const seatNumber = passenger?.seatNumber ?? "Не назначено";
  const fareClass = fare?.class ?? "economy";

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Back + Print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/profile" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Мои бронирования
          </Link>
          <Button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4" />
            Скачать PDF
          </Button>
        </div>

        {/* Ticket card */}
        <div id="ticket-print" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wide">SKY BOOKER AIRLINES</p>
                  <p className="text-lg font-bold">Электронный билет</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Статус</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold text-sm">Подтверждён</span>
                </div>
              </div>
            </div>
          </div>

          {/* PNR + Ticket number */}
          <div className="grid grid-cols-2 gap-4 p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-dashed border-blue-200 dark:border-blue-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">PNR / Код бронирования</p>
              <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{booking.pnr}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Номер билета</p>
              <p className="text-lg font-bold font-mono text-gray-800 dark:text-gray-200">{ticketNumber}</p>
            </div>
          </div>

          {/* Flight route */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Маршрут</h3>
            </div>

            {flight && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                    {fmt(flight.scheduledDeparture, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">{flight.origin?.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{flight.origin?.city}</p>
                </div>

                <div className="flex-1 text-center px-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">{flight.flightNumber}</p>
                  <div className="flex items-center gap-1">
                    <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                    <Plane className="w-4 h-4 text-blue-500 rotate-90" />
                    <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">прямой</p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                    {fmt(flight.scheduledArrival, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">{flight.destination?.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{flight.destination?.city}</p>
                </div>
              </div>
            )}
          </div>

          {/* Date + Flight number */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Дата вылета</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {flight ? fmt(flight.scheduledDeparture, { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Номер рейса</p>
                <p className="font-semibold font-mono text-gray-900 dark:text-white text-sm">
                  {flight?.flightNumber ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Пассажир</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">ФИО</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {user ? `${user.lastName} ${user.firstName}${user.middleName ? " " + user.middleName : ""}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Документ</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm font-mono">
                  {(user as any)?.documentNumber ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Fare + Seat */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Ticket className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Класс</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {CLASS_LABELS[fareClass] ?? fareClass}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Место</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm font-mono">
                  {seatNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Итоговая стоимость</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {booking.totalAmount?.toLocaleString()} ₽
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-blue-600 text-white text-center">
            <p className="text-xs opacity-80">
              Прибудьте в аэропорт не менее чем за 2 часа до вылета · Горячая линия: +7 (800) 555-35-35
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #ticket-print, #ticket-print * { visibility: visible; }
          #ticket-print { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
