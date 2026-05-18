"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Phone, Calendar, Shield, Award, LogOut, Ticket,
  Star, CheckCircle, XCircle, AlertCircle, Plane, MapPin,
  Download, X, Edit3, Save, AlertTriangle,
} from "lucide-react";
import { authService } from "@/lib/services/authService";
import { apiClient } from "@/lib/api/client";
import { UserDTO } from "@/types/dto";

const ROLE_LABELS: Record<string, string> = {
  passenger: "Пассажир",
  agent: "Агент",
  employee: "Сотрудник",
  admin: "Администратор",
};

const ROLE_COLORS: Record<string, string> = {
  passenger: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  employee: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Бронзовый",
  silver: "Серебряный",
  gold: "Золотой",
  platinum: "Платиновый",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-700 dark:text-amber-400",
  silver: "text-gray-500 dark:text-gray-300",
  gold: "text-yellow-500 dark:text-yellow-400",
  platinum: "text-indigo-500 dark:text-indigo-400",
};

const TIER_BG: Record<string, string> = {
  bronze: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
  silver: "from-gray-50 to-slate-50 dark:from-gray-800/40 dark:to-slate-800/40",
  gold: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
  platinum: "from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Паспорт РФ",
  international_passport: "Загранпаспорт",
  birth_certificate: "Свидетельство о рождении",
  other: "Другой документ",
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    documentType: "",
    documentNumber: "",
    documentExpiry: "",
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    setLoadingBookings(true);
    setBookingsError("");
    apiClient
      .get<any[]>("/bookings", true)
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookingsError("Не удалось загрузить бронирования"))
      .finally(() => setLoadingBookings(false));
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    const u = authService.getCurrentUser();
    if (u) {
      setUser(u);
      setForm({
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        middleName: u.middleName ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        dateOfBirth: u.dateOfBirth ?? "",
        nationality: u.nationality ?? "",
        documentType: u.documentType ?? "passport",
        documentNumber: u.documentNumber ?? "",
        documentExpiry: u.documentExpiry ?? "",
      });
    }
    loadBookings();
  }, [router, loadBookings]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const updated = await apiClient.put<UserDTO>(`/users/${user.id}`, form, true);
      setUser(updated);
      localStorage.setItem("currentUser", JSON.stringify(updated));
      setIsEditing(false);
      setSaveMessage({ type: "success", text: "Профиль успешно обновлён" });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Ошибка при сохранении" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Вы уверены, что хотите отменить бронирование? Будет удержана комиссия 10%.")) return;
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
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
          border: "border-l-green-500",
        };
      case "pending_payment":
        return {
          label: "Ожидает оплаты",
          icon: <AlertCircle className="w-4 h-4" />,
          color: "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
          border: "border-l-yellow-400",
        };
      case "cancelled":
      case "refunded":
        return {
          label: status === "refunded" ? "Возвращено" : "Отменено",
          icon: <XCircle className="w-4 h-4" />,
          color: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
          border: "border-l-red-500",
        };
      case "completed":
        return {
          label: "Завершено",
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30",
          border: "border-l-gray-400",
        };
      default:
        return {
          label: "Неизвестно",
          icon: <AlertCircle className="w-4 h-4" />,
          color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30",
          border: "border-l-gray-300",
        };
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const loyalty = user.loyaltyAccount;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Шапка профиля ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700/50">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.lastName} {user.firstName}{user.middleName ? ` ${user.middleName}` : ""}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                    <Shield className="w-3 h-3" />
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <button
                  onClick={() => { authService.logout(); window.location.href = "/"; }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-start"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Редактирование профиля ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Личные данные</h2>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-600 border-blue-200 dark:border-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Редактировать
              </Button>
            )}
          </div>

          <div className="p-6">
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                saveMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700"
              }`}>
                {saveMessage.type === "success"
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                {saveMessage.text}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Фамилия *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Имя *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Отчество</label>
                    <input
                      type="text"
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Телефон *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Дата рождения</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Гражданство</label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      placeholder="Например: RU"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Тип документа</label>
                    <select
                      value={form.documentType}
                      onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="passport">Паспорт РФ</option>
                      <option value="international_passport">Загранпаспорт</option>
                      <option value="birth_certificate">Свид. о рождении</option>
                      <option value="other">Другой документ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Номер документа</label>
                    <input
                      type="text"
                      value={form.documentNumber}
                      onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Срок действия</label>
                    <input
                      type="date"
                      value={form.documentExpiry}
                      onChange={(e) => setForm({ ...form, documentExpiry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Сохранение..." : "Сохранить"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setForm({
                        firstName: user.firstName ?? "",
                        lastName: user.lastName ?? "",
                        middleName: user.middleName ?? "",
                        email: user.email ?? "",
                        phone: user.phone ?? "",
                        dateOfBirth: user.dateOfBirth ?? "",
                        nationality: user.nationality ?? "",
                        documentType: user.documentType ?? "passport",
                        documentNumber: user.documentNumber ?? "",
                        documentExpiry: user.documentExpiry ?? "",
                      });
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { icon: <User className="w-4 h-4" />, label: "ФИО", value: `${user.lastName} ${user.firstName}${user.middleName ? " " + user.middleName : ""}` },
                  { icon: <Mail className="w-4 h-4" />, label: "Email", value: user.email },
                  { icon: <Phone className="w-4 h-4" />, label: "Телефон", value: user.phone },
                  { icon: <Calendar className="w-4 h-4" />, label: "Дата рождения", value: user.dateOfBirth ? fmtDate(user.dateOfBirth) : "—" },
                  { icon: <Shield className="w-4 h-4" />, label: "Гражданство", value: user.nationality || "—" },
                  { icon: <Ticket className="w-4 h-4" />, label: "Тип документа", value: DOC_TYPE_LABELS[user.documentType] ?? user.documentType ?? "—" },
                  { icon: <Ticket className="w-4 h-4" />, label: "Номер документа", value: user.documentNumber || "—" },
                  { icon: <Calendar className="w-4 h-4" />, label: "Срок действия", value: user.documentExpiry ? fmtDate(user.documentExpiry) : "—" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Программа лояльности ── */}
        {loyalty && (
          <div className={`bg-gradient-to-br ${TIER_BG[loyalty.tier] ?? "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700"} rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Программа лояльности</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Уровень</p>
                <p className={`text-base font-bold ${TIER_COLORS[loyalty.tier] ?? ""}`}>
                  <Star className="w-4 h-4 inline mr-1" />
                  {TIER_LABELS[loyalty.tier] ?? loyalty.tier}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Баллы</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{loyalty.points.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Номер карты</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{loyalty.membershipNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Всего баллов</p>
                <p className="text-sm text-gray-900 dark:text-white">{loyalty.lifetimePoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── История бронирований ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Мои бронирования</h2>
          </div>

          <div className="p-6">
            {bookingsError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {bookingsError}
              </div>
            )}

            {loadingBookings ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 && !bookingsError ? (
              <div className="text-center py-10">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">У вас пока нет бронирований</p>
                <Link href="/search">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Найти рейс</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const flight = booking.flight;
                  const si = getStatusInfo(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className={`rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 ${si.border} overflow-hidden hover:shadow-md transition-shadow`}
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                              <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Код бронирования</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{booking.pnr}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold self-start ${si.color}`}>
                            {si.icon}
                            {si.label}
                          </div>
                        </div>

                        {flight && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                            <div className="flex items-start gap-2">
                              <Plane className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Рейс</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{flight.flightNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Маршрут</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {flight.origin?.city ?? flight.origin?.code} → {flight.destination?.city ?? flight.destination?.code}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{flight.origin?.code} — {flight.destination?.code}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Вылет</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{fmtDate(flight.scheduledDeparture)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtTime(flight.scheduledDeparture)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Стоимость</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {booking.totalAmount?.toLocaleString()} ₽
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {booking.status === "pending_payment" && (
                              <>
                                <Link href={`/payment?bookingId=${booking.id}`}>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Оплатить</Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 dark:text-red-400 flex items-center gap-1"
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancellingId === booking.id}
                                >
                                  <X className="w-3 h-3" />
                                  {cancellingId === booking.id ? "..." : "Отменить"}
                                </Button>
                              </>
                            )}
                            {(booking.status === "confirmed" || booking.status === "paid" || booking.status === "checked_in") && (
                              <>
                                <Link href={`/ticket/${booking.id}`}>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
                                    <Ticket className="w-3 h-3" />
                                    Подробнее
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                  onClick={() => handleDownloadTicket(booking)}
                                >
                                  <Download className="w-3 h-3" />
                                  Скачать
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 dark:text-red-400 flex items-center gap-1"
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancellingId === booking.id}
                                >
                                  <X className="w-3 h-3" />
                                  {cancellingId === booking.id ? "..." : "Отменить"}
                                </Button>
                              </>
                            )}
                            {booking.status === "completed" && (
                              <Link href={`/ticket/${booking.id}`}>
                                <Button size="sm" variant="outline" className="flex items-center gap-1">
                                  <Ticket className="w-3 h-3" />
                                  Подробнее
                                </Button>
                              </Link>
                            )}
                            {(booking.status === "cancelled" || booking.status === "refunded") && (
                              <Button size="sm" variant="outline" disabled>Отменено</Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Создано: {fmtDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
