"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Award,
  LogOut,
  Ticket,
  Star,
} from "lucide-react";
import { authService } from "@/lib/services/authService";
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

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    setUser(authService.getCurrentUser());
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700/50">
          {/* Header gradient */}
          <div className="h-28 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-700 dark:to-blue-900" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-14 mb-4 flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.lastName} {user.firstName}
                  {user.middleName ? ` ${user.middleName}` : ""}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-0.5 rounded-full mt-1 ${
                    ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 w-28">Email</span>
                <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 w-28">Телефон</span>
                <span className="text-gray-900 dark:text-white font-medium">{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 w-28">Дата рождения</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDate(user.dateOfBirth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Card */}
        {user.loyaltyAccount && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Программа лояльности
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Уровень
                </p>
                <p className={`text-lg font-bold ${TIER_COLORS[user.loyaltyAccount.tier] ?? ""}`}>
                  <Star className="w-4 h-4 inline mr-1" />
                  {TIER_LABELS[user.loyaltyAccount.tier] ?? user.loyaltyAccount.tier}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Баллы
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.loyaltyAccount.points.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Номер карты
                </p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {user.loyaltyAccount.membershipNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Всего баллов
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {user.loyaltyAccount.lifetimePoints.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/profile" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Мои бронирования
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700 border-red-200 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            onClick={() => {
              authService.logout();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </div>
  );
}
