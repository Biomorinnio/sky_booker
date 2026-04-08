"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Plane, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await apiClient.post<{ message: string; token: string | null }>(
        "/auth/forgot-password",
        { email }
      );
      setResetToken(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при запросе сброса пароля");
    } finally {
      setIsLoading(false);
    }
  };

  if (resetToken) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Код сброса пароля
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Код сброса отправлен на указанный email. Скопируйте его ниже, если письмо ещё не пришло:
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Код для сброса пароля:</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                {resetToken}
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Код действителен в течение 1 часа. Используйте его на странице сброса пароля.
            </p>

            <Link href={`/auth/reset-password?token=${encodeURIComponent(resetToken)}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Перейти к сбросу пароля
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane className="w-8 h-8 text-white rotate-45" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Восстановление пароля
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Введите email, связанный с вашим аккаунтом
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? "Отправка..." : "Получить код сброса"}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
