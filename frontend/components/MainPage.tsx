import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "./common/Hero";
import { FlightSearchForm } from "./features/FlightSearchForm";
import { popularDestinations } from "@/data/mockFlights";
import {
  Plane,
  Shield,
  Clock,
  CreditCard,
  CheckCircle,
  Globe,
  Search,
  ArrowRight,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";

const features = [
  {
    icon: <Search className="w-6 h-6" />,
    title: "Удобный поиск",
    description: "Находите лучшие предложения среди тысяч рейсов за секунды",
    color: "bg-blue-600",
    ring: "hover:border-blue-200 dark:hover:border-blue-800",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Безопасность",
    description: "Защищённые платежи и полная конфиденциальность данных",
    color: "bg-emerald-600",
    ring: "hover:border-emerald-200 dark:hover:border-emerald-800",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Мгновенное оформление",
    description: "Выберите тариф и получите билет за несколько минут",
    color: "bg-violet-600",
    ring: "hover:border-violet-200 dark:hover:border-violet-800",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Гибкая оплата",
    description: "Карты, онлайн-кошельки и другие способы оплаты",
    color: "bg-amber-500",
    ring: "hover:border-amber-200 dark:hover:border-amber-800",
  },
];

const benefits = [
  "Лучшие цены на авиабилеты",
  "Поддержка 24/7",
  "Без скрытых комиссий",
  "Мгновенное подтверждение",
  "Удобная отмена и возврат",
  "Программа лояльности",
];

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Hero />
      <FlightSearchForm />

      {/* ── Popular Destinations ───────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-2">
              Направления
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Популярные маршруты
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Выгодные предложения на самые востребованные направления
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularDestinations.map((dest, i) => (
              <Link
                key={i}
                href={`/search?destination=${encodeURIComponent(dest.city)}`}
                className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* City photo */}
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.image}
                    alt={dest.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                </div>

                {/* Card content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-bold leading-tight">
                        {dest.city}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {dest.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-slate-300">от</p>
                      <p className="text-lg font-bold text-blue-300">
                        {dest.fromPrice.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>

                {/* Airport code badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-mono px-2 py-0.5 rounded">
                    {dest.code}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-2">
              Преимущества
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Почему выбирают SkyBooker
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800 ${f.ring} transition-all hover:shadow-md`}
              >
                <div className={`w-11 h-11 ${f.color} rounded-lg flex items-center justify-center text-white mb-4 shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-2">
              Процесс
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Как забронировать билет
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: 1,
                icon: <Search className="w-6 h-6" />,
                title: "Найдите рейс",
                desc: "Укажите откуда, куда и дату вылета",
              },
              {
                step: 2,
                icon: <SlidersHorizontal className="w-6 h-6" />,
                title: "Выберите тариф",
                desc: "Сравните Эконом, Комфорт и Бизнес",
              },
              {
                step: 3,
                icon: <UserCheck className="w-6 h-6" />,
                title: "Заполните данные",
                desc: "Введите информацию о пассажирах",
              },
              {
                step: 4,
                icon: <CreditCard className="w-6 h-6" />,
                title: "Оплатите",
                desc: "Получите электронный билет на email",
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Dashed connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-[calc(100%-64px)] border-t-2 border-dashed border-blue-200 dark:border-blue-800 z-0" />
                )}

                {/* Step number circle with gradient */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    {item.step}
                  </span>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300 w-full">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
                О нас
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                Более 10 000
                <br />
                довольных клиентов
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                SkyBooker — современная платформа для поиска и бронирования
                авиабилетов. Мы предлагаем лучшие цены, удобный интерфейс и
                надёжный сервис.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">50+</p>
                  <p className="text-sm text-slate-400 mt-1">Направлений</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">6</p>
                  <p className="text-sm text-slate-400 mt-1">Авиакомпаний</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">24/7</p>
                  <p className="text-sm text-slate-400 mt-1">Поддержка</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                >
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
            <Plane className="w-7 h-7 text-white rotate-45" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Готовы к путешествию?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Найдите и забронируйте рейс прямо сейчас — быстро и без лишних
            шагов.
          </p>
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 text-base font-semibold shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all">
              Начать поиск
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
