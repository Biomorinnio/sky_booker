import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const VkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.77 19.15h1.2s.36-.04.55-.24c.17-.18.16-.53.16-.53s-.02-1.63.73-1.87c.74-.24 1.69 1.58 2.7 2.28.76.53 1.34.41 1.34.41l2.69-.04s1.4-.09.74-1.18c-.06-.09-.4-.81-2.04-2.29-1.72-1.55-1.49-1.3.58-3.98 1.26-1.63 1.76-2.63 1.6-3.06-.15-.4-1.08-.3-1.08-.3l-3.03.02s-.22-.03-.39.07c-.17.1-.27.33-.27.33s-.49 1.3-1.14 2.41c-1.38 2.34-1.93 2.46-2.15 2.32-.52-.34-.39-1.36-.39-2.08 0-2.26.34-3.2-.67-3.45-.34-.08-.58-.14-1.44-.15-.11 0-.94 0-1.44.01-.71.02-1.04.23-1.36.42-.1.06-.02.1.07.1.55.03 1.01.41 1.01.41s.67 1.03.57 3.35c-.03.68-.31.91-.31.91-.52.33-1.42-.35-2.41-2.3-.43-1.06-.87-2.37-.87-2.37s-.08-.2-.23-.31c-.18-.14-.43-.18-.43-.18l-2.88.02s-.43.01-.59.2c-.14.17-.01.52-.01.52s2.3 5.39 4.9 8.11c2.38 2.49 5.09 2.33 5.09 2.33Z" />
  </svg>
);

const VkMessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.36 5.22 3.48 6.87l-.42 3.1c-.06.46.43.79.83.55l2.91-1.72C9.8 20.25 10.87 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2Zm4.26 7.12-2.1 3.33c-.34.54-1.1.63-1.56.18l-1.67-1.61a.5.5 0 0 0-.63-.04l-2.26 1.71c-.3.23-.7-.1-.51-.43l2.1-3.33c.34-.54 1.1-.63 1.56-.18l1.67 1.61a.5.5 0 0 0 .63.04l2.26-1.71c.3-.23.7.1.51.43Z" />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="mt-16 bg-liquid-glass bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700/20 px-6 py-8 w-11/12 max-w-7xl mx-auto rounded-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-gray-800 dark:text-gray-100">
          <h3 className="text-lg font-bold">SkyBooker</h3>
          <p className="text-sm mt-1 max-w-md">
            Веб-платформа для онлайн-бронирования авиабилетов с удобным
            интерфейсом и современным дизайном
          </p>
          <p className="text-xs mt-2 opacity-70">
            &copy; {new Date().getFullYear()} SkyBooker. Все права защищены.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>+7 (800) 555-35-35</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:support@skybooker.ru"
              className="hover:text-blue-500 transition-colors"
            >
              support@skybooker.ru
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Москва, Россия</span>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="#"
            className="hover:text-blue-500 transition-colors"
            title="ВКонтакте"
          >
            <VkIcon className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="hover:text-blue-400 transition-colors"
            title="VK Мессенджер"
          >
            <VkMessengerIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};
