"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchLanding, type LandingData } from "./api/landing";
import { useLanguage } from "./language-context";

type LandingContextValue = {
  data: LandingData | null;
  loading: boolean;
};

const LandingContext = createContext<LandingContextValue>({ data: null, loading: true });

export const LandingProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLanding(language)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return <LandingContext.Provider value={{ data, loading }}>{children}</LandingContext.Provider>;
};

export const useLanding = () => useContext(LandingContext);
