"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Background: replace this URL with your own aviation photo later
const BG_URL = "https://picsum.photos/seed/aviation-sky/1920/800";

export const Hero = () => {
  return (
    <section
      className="w-full h-[580px] relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-4">
          Онлайн-бронирование авиабилетов
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
          Найдите лучший рейс
          <br />
          <span className="text-blue-400">за считанные секунды</span>
        </h1>
        <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
          Сравнивайте цены, выбирайте тариф и оформляйте билеты — без лишних
          шагов.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base font-semibold shadow-lg shadow-blue-900/40 transition-all">
              Найти рейс
            </Button>
          </Link>
          <Link href="/flight-status">
            <Button
              variant="outline"
              className="bg-blue-200 hover:bg-blue-500 border-white/30 text-black hover:text-white px-8 py-3 text-base"
            >
              Статус рейса
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-10 text-sm text-slate-400">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">50+</p>
            <p>направлений</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">6</p>
            <p>авиакомпаний</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">10 000+</p>
            <p>клиентов</p>
          </div>
        </div>
      </div>
    </section>
  );
};
