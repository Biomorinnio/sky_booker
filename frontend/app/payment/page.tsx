"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  Lock,
  AlertCircle,
  Plane,
} from "lucide-react";
import { PaymentMethod } from "@/types";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/services/authService";

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    // Try sessionStorage first (from booking flow)
    const stored = sessionStorage.getItem("pendingBooking");
    if (stored) {
      try {
        setBooking(JSON.parse(stored));
        return;
      } catch {
        // ignore
      }
    }

    // If bookingId in URL, load from API (from "Pay" button in bookings list)
    const bookingId = searchParams.get("bookingId");
    if (bookingId) {
      apiClient
        .get<any>(`/bookings/${bookingId}`, true)
        .then((data) => setBooking(data))
        .catch(() => setError("Не удалось загрузить данные бронирования"));
    }
  }, [router, searchParams]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking?.id) {
      setError("Данные бронирования не найдены. Вернитесь к поиску рейсов.");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      await apiClient.post<{ payment: any; message: string }>(
        "/payments",
        { bookingId: booking.id, method: paymentMethod },
        true
      );

      sessionStorage.removeItem("pendingBooking");
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка при обработке платежа"
      );
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-8 shadow-2xl text-center border border-white/20 dark:border-gray-700/20">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Оплата успешна!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Ваше бронирование подтверждено. Билет отправлен на указанный email.
          </p>
          {booking?.pnr && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Код бронирования (PNR)
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {booking.pnr}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {booking?.id && (
              <Link href={`/ticket/${booking.id}`}>
                <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">
                  Перейти к билету
                </Button>
              </Link>
            )}
            <Link href="/account">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                Перейти в личный кабинет
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Вернуться на главную
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const amount = booking?.totalAmount ?? 0;

  const steps = [
    { label: "Рейс", done: true },
    { label: "Пассажиры", done: true },
    { label: "Услуги", done: true },
    { label: "Оплата", done: false, active: true },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Оплата бронирования
        </h1>

        {/* Stepper */}
        <div className="flex items-center mb-8 select-none">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step.done && !step.active
                    ? "bg-green-500 text-white"
                    : step.active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                }`}>
                  {step.done && !step.active ? "✓" : i + 1}
                </div>
                <span className={`mt-1 text-xs font-medium whitespace-nowrap ${
                  step.active ? "text-blue-600 dark:text-blue-400" : step.done ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                }`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-12px] transition-all ${step.done && !step.active ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Способ оплаты
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      { method: "card", icon: <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />, label: "Банковская карта" },
                      { method: "apple_pay", icon: <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />, label: "Apple Pay" },
                      { method: "google_pay", icon: <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />, label: "Google Pay" },
                      { method: "bank_transfer", icon: <Building className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />, label: "Банковский перевод" },
                    ] as { method: PaymentMethod; icon: React.ReactNode; label: string }[]
                  ).map(({ method, icon, label }) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === method
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      {icon}
                      <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "card" && (
                <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Данные карты
                  </h2>

                  {/* Визуализация карты */}
                  <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl mb-6 overflow-hidden select-none"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)" }}>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 12px)"
                    }} />
                    <div className="absolute top-4 right-4 flex gap-1">
                      <div className="w-8 h-8 rounded-full bg-red-500 opacity-90" />
                      <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-90 -ml-3" />
                    </div>
                    <div className="absolute bottom-4 left-5 right-5">
                      <p className="font-mono text-white text-lg tracking-widest mb-2">
                        {cardNumber
                          ? cardNumber.replace(/(.{4})/g, "$1 ").trim()
                          : "•••• •••• •••• ••••"}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-blue-200 text-[10px] uppercase tracking-wide mb-0.5">Держатель</p>
                          <p className="text-white text-sm font-semibold uppercase tracking-wide">
                            {cardHolder || "CARD HOLDER"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-200 text-[10px] uppercase tracking-wide mb-0.5">Действует до</p>
                          <p className="text-white text-sm font-semibold font-mono">{cardExpiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Номер карты *
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(raw.replace(/(.{4})/g, "$1 ").trim());
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono tracking-widest"
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Срок действия *
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(raw.length > 2 ? raw.slice(0, 2) + "/" + raw.slice(2) : raw);
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                          required
                          disabled={isProcessing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          required
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имя держателя карты *
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="IVAN IVANOV"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Безопасная оплата
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Все платежи защищены SSL-шифрованием. Мы не храним данные вашей карты.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !booking?.id}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-4 text-lg font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
              >
                {isProcessing
                  ? "Обработка..."
                  : `Оплатить${amount > 0 ? ` ₽${amount.toLocaleString()}` : ""}`}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg sticky top-24 border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Детали заказа
              </h2>

              <div className="space-y-3 mb-6">
                {booking?.flight ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Рейс</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {booking.flight.flightNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Маршрут</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {booking.flight.origin?.code} → {booking.flight.destination?.code}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Дата</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {fmtDate(booking.flight.scheduledDeparture)}
                      </span>
                    </div>
                  </>
                ) : booking ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Plane className="w-4 h-4" />
                    <span>PNR: {booking.pnr ?? "—"}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Данные заказа не найдены
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Стоимость билета</span>
                  <span className="text-gray-900 dark:text-white">
                    ₽{amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Сервисный сбор</span>
                  <span className="text-gray-900 dark:text-white">₽0</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Итого</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ₽{amount.toLocaleString()}
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
