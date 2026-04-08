"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, FileText, AlertCircle, Plane } from "lucide-react";
import { Passenger } from "@/types";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/services/authService";

function BookingPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const flightId = sp.get("flightId") ?? "";
  const fareId = sp.get("fareId") ?? "";

  const [passengers, setPassengers] = useState<Partial<Passenger>[]>([
    {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
      documentType: "passport",
      documentNumber: "",
      documentExpiry: "",
      nationality: "RU",
    },
  ]);

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    countryCode: "+7",
  });

  const [flightData, setFlightData] = useState<any>(null);
  const [selectedFare, setSelectedFare] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    if (!flightId) {
      router.push("/search");
      return;
    }

    apiClient
      .get<any>(`/flights/${flightId}`)
      .then((data) => {
        setFlightData(data);
        const fare = (data.fares ?? []).find((f: any) => f.id === fareId);
        setSelectedFare(fare ?? data.fares?.[0] ?? null);
      })
      .catch(() => {
        setError("Не удалось загрузить данные рейса");
      });
  }, [flightId, fareId, router]);

  const totalAmount = (selectedFare?.price ?? 0) * passengers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ booking: any; message: string }>(
        "/bookings",
        {
          flightId,
          fareId: selectedFare?.id ?? fareId,
          passengers: passengers.map((p) => ({
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            documentType: p.documentType,
            documentNumber: p.documentNumber,
            documentExpiry: p.documentExpiry,
            nationality: p.nationality,
          })),
        },
        true
      );

      sessionStorage.setItem("pendingBooking", JSON.stringify(response.booking));
      router.push("/payment");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при создании бронирования"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "male",
        documentType: "passport",
        documentNumber: "",
        documentExpiry: "",
        nationality: "RU",
      },
    ]);
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Оформление бронирования
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Пассажир {index + 1}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имя *
                      </label>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].firstName = e.target.value;
                          setPassengers(p);
                        }}
                        placeholder="Иван"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].lastName = e.target.value;
                          setPassengers(p);
                        }}
                        placeholder="Иванов"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Дата рождения *
                      </label>
                      <input
                        type="date"
                        value={passenger.dateOfBirth}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].dateOfBirth = e.target.value;
                          setPassengers(p);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Пол *
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].gender = e.target.value as "male" | "female";
                          setPassengers(p);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Тип документа *
                      </label>
                      <select
                        value={passenger.documentType}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].documentType = e.target.value as any;
                          setPassengers(p);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="passport">Паспорт</option>
                        <option value="id_card">Удостоверение личности</option>
                        <option value="birth_certificate">Свидетельство о рождении</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Номер документа *
                      </label>
                      <input
                        type="text"
                        value={passenger.documentNumber}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].documentNumber = e.target.value;
                          setPassengers(p);
                        }}
                        placeholder="1234 567890"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Срок действия *
                      </label>
                      <input
                        type="date"
                        value={passenger.documentExpiry}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].documentExpiry = e.target.value;
                          setPassengers(p);
                        }}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Гражданство *
                      </label>
                      <select
                        value={passenger.nationality}
                        onChange={(e) => {
                          const p = [...passengers];
                          p[index].nationality = e.target.value;
                          setPassengers(p);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="RU">Россия</option>
                        <option value="BY">Беларусь</option>
                        <option value="KZ">Казахстан</option>
                        <option value="UA">Украина</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                onClick={addPassenger}
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
              >
                + Добавить пассажира
              </Button>

              <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Контактная информация
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, email: e.target.value })
                      }
                      placeholder="example@mail.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      На этот адрес будет отправлен билет
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Телефон *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={contactInfo.countryCode}
                        onChange={(e) =>
                          setContactInfo({ ...contactInfo, countryCode: e.target.value })
                        }
                        className="w-24 px-2 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="+7">+7</option>
                        <option value="+375">+375</option>
                        <option value="+77">+77</option>
                      </select>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) =>
                          setContactInfo({ ...contactInfo, phone: e.target.value })
                        }
                        placeholder="900 123 45 67"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !flightData}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Создаём бронирование..." : "Продолжить к оплате"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg sticky top-24 border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Детали бронирования
              </h2>

              {flightData ? (
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Plane className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Рейс</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {flightData.flightNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Маршрут</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {flightData.origin?.city} → {flightData.destination?.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Дата и время</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {fmtDate(flightData.scheduledDeparture)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fmtTime(flightData.scheduledDeparture)} → {fmtTime(flightData.scheduledArrival)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Пассажиры</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {passengers.length}{" "}
                        {passengers.length === 1 ? "пассажир" : "пассажира"}
                      </p>
                    </div>
                  </div>

                  {selectedFare && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Тариф</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {selectedFare.class}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mb-6 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {selectedFare && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Тариф</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₽{selectedFare.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600 dark:text-gray-400">Пассажиры</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        × {passengers.length}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Итого</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ₽{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <BookingPageInner />
    </Suspense>
  );
}
