/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/use-localized-metadata.ts
"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface MetadataConfig {
  page?: string; // e.g., "tracker", "mealPlanner", "dashboard"
  appendSiteName?: boolean;
}

export function useLocalizedMetadata(config?: MetadataConfig) {
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

    // Determine which metadata to use
    const metadataPath = config?.page
      ? `metadata.${config.page}`
      : "metadata.default";

    // Set title
    const title = getNestedValue(t, `${metadataPath}.title`) || "NutriAI";
    const finalTitle =
      config?.page && config?.appendSiteName !== false
        ? `${title} - NutriAI`
        : title;
    document.title = finalTitle;

    // Set description
    const description = getNestedValue(t, `${metadataPath}.description`);
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute("content", description);
    }

    // Set HTML lang attribute
    document.documentElement.lang = language;
  }, [language, t, config]);
}
