"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Luggage,
  UtensilsCrossed,
  Armchair,
  Shield,
  Wifi,
  CheckCircle,
} from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const services = [
    {
      id: "extra-baggage",
      icon: <Luggage className="w-8 h-8" />,
      name: "Дополнительный багаж",
      description: "1 место до 23 кг",
      price: 2500,
      category: "baggage",
    },
    {
      id: "meal-standard",
      icon: <UtensilsCrossed className="w-8 h-8" />,
      name: "Стандартное питание",
      description: "Горячее блюдо и напитки",
      price: 800,
      category: "meal",
    },
    {
      id: "meal-premium",
      icon: <UtensilsCrossed className="w-8 h-8" />,
      name: "Премиум питание",
      description: "Расширенное меню",
      price: 1500,
      category: "meal",
    },
    {
      id: "seat-extra-legroom",
      icon: <Armchair className="w-8 h-8" />,
      name: "Место с увеличенным пространством",
      description: "Дополнительное пространство для ног",
      price: 1200,
      category: "seat",
    },
    {
      id: "insurance",
      icon: <Shield className="w-8 h-8" />,
      name: "Страхование поездки",
      description: "Полное покрытие рисков",
      price: 500,
      category: "insurance",
    },
    {
      id: "wifi",
      icon: <Wifi className="w-8 h-8" />,
      name: "Wi-Fi на борту",
      description: "Безлимитный интернет",
      price: 600,
      category: "wifi",
    },
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getTotalPrice = () => {
    return services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  };

  const handleContinue = () => {
    router.push("/payment");
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 lg:px-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Дополнительные услуги
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Сделайте ваш полет еще комфортнее
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);

                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`bg-liquid-glass backdrop-blur-xl rounded-xl p-6 shadow-lg cursor-pointer transition-all border-2 ${
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
                        {service.icon}
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
                      +₽{service.price.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-4">
              <Link href="/booking" className="flex-1">
                <Button variant="outline" className="w-full">
                  Назад
                </Button>
              </Link>
              <Button
                onClick={handleContinue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                Продолжить
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 shadow-lg sticky top-24 border border-white/20 dark:border-gray-700/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Итого
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Билет
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₽6,800
                  </span>
                </div>

                {selectedServices.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Дополнительные услуги:
                      </p>
                      {services
                        .filter((s) => selectedServices.includes(s.id))
                        .map((service) => (
                          <div
                            key={service.id}
                            className="flex justify-between text-sm mb-1"
                          >
                            <span className="text-gray-600 dark:text-gray-400">
                              {service.name}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              ₽{service.price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Итого</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ₽{(6800 + getTotalPrice()).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedServices.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Вы экономите ₽
                  {Math.floor(getTotalPrice() * 0.1).toLocaleString()} при
                  покупке услуг вместе с билетом
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
