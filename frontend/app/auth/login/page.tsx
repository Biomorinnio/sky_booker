"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Plane, AlertCircle } from "lucide-react";
import { authService } from "@/lib/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      if (response.user.role === "employee" || response.user.role === "admin") {
        router.push("/dashboard");
      } else if (response.user.role === "agent") {
        router.push("/agent");
      } else {
        router.push("/account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane className="w-8 h-8 text-white rotate-45" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Вход в SkyBooker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Войдите в свой аккаунт для управления бронированиями
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-gray-600 dark:text-gray-400">
                  Запомнить меня
                </span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Нет аккаунта?{" "}
              <Link
                href="/auth/register"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              Тестовые аккаунты:
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Пассажир:
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  passenger@sky-booker.ru / password
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Агент:
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  agent@sky-booker.ru / password
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Сотрудник:
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  employee@sky-booker.ru / password
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
