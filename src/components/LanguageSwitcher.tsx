import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { currentLang, changeLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    changeLang(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
        aria-label="Changer la langue"
      >
        <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
          {currentLanguageInfo?.flag} {currentLanguageInfo?.code.toUpperCase()}
        </span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:hidden">
          {currentLanguageInfo?.flag}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                  currentLang === lang.code && "bg-primary/5 dark:bg-primary/10"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
                {currentLang === lang.code && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
