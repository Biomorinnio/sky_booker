"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cls =
    "p-2 rounded-full bg-liquid-glass border border-white/25 dark:border-gray-600/40 hover:scale-105 transition-all duration-200 text-gray-700 dark:text-gray-200 flex items-center justify-center";

  if (!mounted) {
    return <div className={cls}><div className="w-5 h-5" /></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cls}
      title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
    >
      <div className="relative w-5 h-5">
        <SunIcon
          className={`absolute inset-0 !w-5 !h-5 transition-opacity duration-300 ${
            theme === "light" ? "opacity-100" : "opacity-0"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 !w-5 !h-5 transition-opacity duration-300 ${
            theme === "dark" ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </button>
  );
}
