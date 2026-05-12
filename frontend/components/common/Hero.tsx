"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const BG_URL = "/images/hero.png";

export const Hero = () => {
  return (
    <section
      className="w-full h-[600px] relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
      }}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 rounded-full px-4 py-1.5 my-2 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase">
            Онлайн-бронирование авиабилетов
          </p>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight drop-shadow-lg">
          Найдите лучший рейс
          <br />
          <span className="text-blue-400">за считанные секунды</span>
        </h1>
        <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
          Сравнивайте цены, выбирайте тариф и оформляйте билеты — без лишних
          шагов.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-base font-semibold shadow-xl shadow-blue-900/50 transition-all hover:scale-105 active:scale-95">
              Найти рейс
            </Button>
          </Link>
          <Link href="/flight-status">
            <Button
              variant="outline"
              className="border-white/40  text-black hover:bg-white/50 hover:border-white px-8 py-3 text-base backdrop-blur-sm transition-all"
            >
              Статус рейса
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-400">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">50+</p>
            <p className="mt-0.5">направлений</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">6</p>
            <p className="mt-0.5">авиакомпаний</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">10 000+</p>
            <p className="mt-0.5">клиентов</p>
          </div>
        </div>
      </div>
    </section>
  );
};
