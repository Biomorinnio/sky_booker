import React from "react";
import Link from "next/link";
import { Plane } from "lucide-react";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
        <Plane className="w-6 h-6 text-white rotate-45" />
      </div>
      <span className="text-xl font-bold text-foreground select-none">
        SkyBooker
      </span>
    </Link>
  );
};
