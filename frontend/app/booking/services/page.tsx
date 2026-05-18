"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/services/authService";
import {
  AlertCircle,
  Armchair,
  CheckCircle,
  Luggage,
  Shield,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";

interface BookingSummary {
  id: string;
  pnr?: string;
  totalAmount: number;
  fare?: { class?: string };
  flight?: {
    flightNumber?: string;
    origin?: { code?: string; city?: string };
    destination?: { code?: string; city?: string };
  };
}

interface AdditionalService {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  applicableClasses: string[];
}

const serviceIcons: Record<string, React.ReactNode> = {
  baggage: <Luggage className="w-8 h-8" />,
  meal: <UtensilsCrossed className="w-8 h-8" />,
  seat_selection: <Armchair className="w-8 h-8" />,
  priority_boarding: <CheckCircle className="w-8 h-8" />,
  lounge_access: <Wifi className="w-8 h-8" />,
  insurance: <Shield className="w-8 h-8" />,
};

function formatMoney(value: number) {
  return `₽${Number(value || 0).toLocaleString("ru-RU")}`;
}

export default function ServicesPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/auth/login");
        return;
      }

      await Promise.resolve();

      const stored = sessionStorage.getItem("pendingBooking");
      if (!stored) {
        setError("Бронирование не найдено. Вернитесь к выбору рейса.");
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as BookingSummary;
        const query = parsed.fare?.class
          ? `/services?fareClass=${encodeURIComponent(parsed.fare.class)}`
          : "/services";
        const data = await apiClient.get<{ services: AdditionalService[] }>(query);

        setBooking(parsed);
        setServices(data.services ?? []);
      } catch {
        setError("Не удалось загрузить дополнительные услуги");
      } finally {
        setIsLoading(false);
      }
    };

    void loadServices();
  }, [router]);

  const selectedTotal = useMemo(
    () =>
      services
        .filter((service) => selectedServices.includes(service.id))
        .reduce((sum, service) => sum + service.price, 0),
    [selectedServices, services]
  );

  const totalAmount = (booking?.totalAmount ?? 0) + selectedTotal;

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = async () => {
    if (!booking?.id) {
      setError("Бронирование не найдено. Вернитесь к выбору рейса.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      for (const serviceId of selectedServices) {
        await apiClient.post(
          `/bookings/${booking.id}/services`,
          { serviceId, quantity: 1 },
          true
        );
      }

      const updatedBooking = await apiClient.get<BookingSummary>(
        `/bookings/${booking.id}`,
        true
      );
      sessionStorage.setItem("pendingBooking", JSON.stringify(updatedBooking));
      router.push("/payment");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось добавить выбранные услуги"
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Дополнительные услуги
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите опции для бронирования {booking?.pnr ? `PNR ${booking.pnr}` : ""}
          </p>
        </div>

        <div className="flex items-center mb-8 select-none">
          {["Рейс", "Пассажиры", "Услуги", "Оплата"].map((label, index) => {
            const done = index < 2;
            const active = index === 2;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done
                        ? "bg-green-500 text-white"
                        : active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </div>
                  <span
                    className={`mt-1 text-xs font-medium whitespace-nowrap ${
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : done
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                      done ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    disabled={isSubmitting}
                    className={`text-left bg-liquid-glass backdrop-blur-xl rounded-xl p-6 shadow-lg transition-all border-2 ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-500"
                        : "bg-white/80 dark:bg-gray-800/80 border-white/20 dark:border-gray-700/20 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {serviceIcons[service.type] ?? <CheckCircle className="w-8 h-8" />}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {service.description}
                    </p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      +{formatMoney(service.price)}
                    </p>
                  </button>
                );
              })}
            </div>

            {services.length === 0 && !error && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  Для выбранного тарифа нет доступных дополнительных услуг.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <Link href="/booking" className="flex-1">
                <Button variant="outline" className="w-full" disabled={isSubmitting}>
                  Назад
                </Button>
              </Link>
              <Button
                onClick={handleContinue}
                disabled={isSubmitting || !booking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                {isSubmitting ? "Сохраняем..." : "Продолжить"}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg sticky top-24 border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Итого
              </h2>

              <div className="space-y-3 mb-6">
                {booking?.flight && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {booking.flight.flightNumber}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.flight.origin?.code} → {booking.flight.destination?.code}
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Билет</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatMoney(booking?.totalAmount ?? 0)}
                  </span>
                </div>

                {selectedServices.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Дополнительные услуги
                    </p>
                    {services
                      .filter((service) => selectedServices.includes(service.id))
                      .map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between gap-3 text-sm mb-1"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {service.name}
                          </span>
                          <span className="text-gray-900 dark:text-white whitespace-nowrap">
                            {formatMoney(service.price)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">К оплате</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatMoney(totalAmount)}
                  </span>
                </div>
              </div>

              {selectedServices.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Можно продолжить без дополнительных услуг.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
