/* eslint-disable @typescript-eslint/no-explicit-any */
// components/metadata-updater.tsx
"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

export function MetadataUpdater() {
  const { language, t } = useLanguage();

  useEffect(() => {
    // Helper to safely get nested values
    const getNestedValue = (obj: unknown, path: string): string | undefined => {
      try {
        const value = path.split(".").reduce((current: any, key: string) => {
          return current?.[key];
        }, obj);
        return typeof value === "string" ? value : undefined;
      } catch {
        return undefined;
      }
    };

    // Update default title and description only
    const title = getNestedValue(t, "metadata.default.title") || "Eat Smart AI";
    const description = getNestedValue(t, "metadata.default.description");

    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute("content", description);
    }

    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language, t]);

  return null;
}
