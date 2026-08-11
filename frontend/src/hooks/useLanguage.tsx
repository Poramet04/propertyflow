import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { translateKnownText } from "../i18n/translations";

type Language = "en" | "th";

interface LanguageContextValue {
  language: Language;
  isThai: boolean;
  toggleLanguage: () => void;
  pick: (english: string, thai: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

type TextRecord = { original: string; translated: string };
type AttributeRecord = Record<string, { original: string; translated: string }>;

function DocumentTranslator({ isThai }: { isThai: boolean }) {
  const textRecords = useRef(new WeakMap<Text, TextRecord>());
  const attributeRecords = useRef(new WeakMap<Element, AttributeRecord>());

  useLayoutEffect(() => {
    let applying = false;
    let frame = 0;
    const attributes = ["placeholder", "aria-label", "title"];

    const apply = () => {
      if (applying || !document.body) return;
      applying = true;
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      let current = walker.nextNode() as Text | null;
      while (current) {
        const parent = current.parentElement;
        if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
          const value = current.nodeValue ?? "";
          let record = textRecords.current.get(current);
          if (isThai) {
            if (!record && /[\u0E00-\u0E7F]/.test(value)) {
              current = walker.nextNode() as Text | null;
              continue;
            }
            if (!record || (value !== record.original && value !== record.translated)) {
              record = { original: value, translated: value };
            }
            const translated = translateKnownText(record.original);
            record.translated = translated;
            textRecords.current.set(current, record);
            if (value !== translated) current.nodeValue = translated;
          } else if (record && value !== record.original) {
            current.nodeValue = record.original;
          }
        }
        current = walker.nextNode() as Text | null;
      }

      document.body.querySelectorAll("*").forEach((element) => {
        const saved = attributeRecords.current.get(element) ?? {};
        for (const attribute of attributes) {
          const value = element.getAttribute(attribute);
          if (value == null) continue;
          if (isThai) {
            const previous = saved[attribute];
            if (!previous && /[\u0E00-\u0E7F]/.test(value)) continue;
            const original =
              previous && (value === previous.original || value === previous.translated)
                ? previous.original
                : value;
            const translated = translateKnownText(original);
            saved[attribute] = { original, translated };
            if (value !== translated) element.setAttribute(attribute, translated);
          } else if (saved[attribute] && value !== saved[attribute].original) {
            element.setAttribute(attribute, saved[attribute].original);
          }
        }
        attributeRecords.current.set(element, saved);
      });
      applying = false;
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    apply();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributes,
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [isThai]);

  return null;
}

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
      <DocumentTranslator isThai={language === "th"} />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
