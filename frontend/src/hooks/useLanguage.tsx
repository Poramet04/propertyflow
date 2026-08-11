import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "th";

interface LanguageContextValue {
  language: Language;
  isThai: boolean;
  toggleLanguage: () => void;
  pick: (english: string, thai: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("propertyflow-language") === "th" ? "th" : "en",
  );

  useEffect(() => {
    localStorage.setItem("propertyflow-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isThai: language === "th",
      toggleLanguage: () =>
        setLanguage((current) => (current === "en" ? "th" : "en")),
      pick: (english, thai) => (language === "th" ? thai : english),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
