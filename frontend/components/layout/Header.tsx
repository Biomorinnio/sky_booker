"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "../common/Logo";
import { ThemeSwitch } from "../common/ThemeSwitch";
import { Search, Ticket, LogIn, X, Plane, User, LogOut, Radio } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { apiClient } from "@/lib/api/client";
import { UserDTO } from "@/types/dto";

interface FlightResult {
  id: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
}

export const Header = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<FlightResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allFlights, setAllFlights] = useState<FlightResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
    const unsub = authService.onChange(() => {
      setCurrentUser(authService.getCurrentUser());
    });
    return unsub;
  }, []);

  // Load flights for search dropdown
  useEffect(() => {
    apiClient
      .get<{ data: any[] }>("/flights?limit=100")
      .then((res) => {
        const mapped = (res.data ?? []).map((dto: any) => ({
          id: dto.id,
          flightNumber: dto.flightNumber,
          origin: dto.origin?.city ?? "",
          originCode: dto.origin?.code ?? "",
          destination: dto.destination?.city ?? "",
          destinationCode: dto.destination?.code ?? "",
        }));
        setAllFlights(mapped);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filterFlights = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      const lower = q.toLowerCase();
      const filtered = allFlights.filter(
        (f) =>
          f.origin.toLowerCase().includes(lower) ||
          f.destination.toLowerCase().includes(lower) ||
          f.flightNumber.toLowerCase().includes(lower) ||
          f.originCode.toLowerCase().includes(lower) ||
          f.destinationCode.toLowerCase().includes(lower)
      );
      setResults(filtered.slice(0, 6));
      setShowDropdown(true);
    },
    [allFlights]
  );

  const handleInputChange = (val: string) => {
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => filterFlights(val), 300);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
    setResults([]);
    setShowDropdown(false);
  };

  const submitSearch = () => {
    const q = searchValue.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    closeSearch();
  };

  const handleResultClick = (flight: FlightResult) => {
    router.push(`/search?origin=${encodeURIComponent(flight.origin)}&destination=${encodeURIComponent(flight.destination)}`);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitSearch();
    if (e.key === "Escape") closeSearch();
  };

  const iconCls =
    "p-2 rounded-full bg-liquid-glass border border-white/25 dark:border-gray-600/40 hover:scale-105 transition-all duration-200 text-gray-700 dark:text-gray-200 flex items-center justify-center";

  return (
    <header className="fixed top-4 w-11/12 max-w-7xl mx-auto left-1/2 -translate-x-1/2 z-50 bg-liquid-glass bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 px-5 py-3 flex justify-between items-center rounded-2xl shadow-lg">
      <Logo />

      <div className="flex items-center gap-2">
        {/* Expandable search with dropdown */}
        {searchOpen ? (
          <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 shadow-inner">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Город, направление, номер рейса..."
                className="w-48 md:w-64 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              />
              <button
                onClick={submitSearch}
                className="text-blue-600 dark:text-blue-400 hover:opacity-75 transition-opacity"
                title="Найти"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={closeSearch}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown results */}
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden z-50">
                {results.map((flight) => (
                  <button
                    key={flight.id}
                    onClick={() => handleResultClick(flight)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <Plane className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {flight.origin} → {flight.destination}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {flight.flightNumber} · {flight.originCode}–{flight.destinationCode}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button onClick={openSearch} className={iconCls} title="Поиск рейсов">
            <Search className="w-5 h-5" />
          </button>
        )}

        <Link href="/search" className={iconCls} title="Поиск рейсов">
          <Plane className="w-5 h-5" />
        </Link>

        {currentUser ? (
          <>
            {(currentUser.role === "admin" || currentUser.role === "employee") && (
              <Link href="/dashboard" className={iconCls} title="Панель управления">
                <Ticket className="w-5 h-5" />
              </Link>
            )}
            <Link href="/account" className={iconCls} title="Личный кабинет">
              <User className="w-5 h-5" />
            </Link>
          </>
        ) : (
          <Link href="/auth/login" className={iconCls} title="Войти">
            <LogIn className="w-5 h-5" />
          </Link>
        )}

        <Link href="/flight-status" className={iconCls} title="Статус рейсов">
          <Radio className="w-5 h-5" />
        </Link>

        <ThemeSwitch />
      </div>
    </header>
  );
};
