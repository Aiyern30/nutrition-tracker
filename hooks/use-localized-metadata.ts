/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/use-localized-metadata.ts
"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface MetadataConfig {
  titleKey?: string;
  descriptionKey?: string;
  usePageTitle?: boolean;
}

export function useLocalizedMetadata(config?: MetadataConfig) {
  const { language, t } = useLanguage();

  useEffect(() => {
    // Get nested value from translation object using dot notation
    const getNestedValue = (
      obj: Record<string, any>,
      path: string
    ): string | undefined => {
      return path.split(".").reduce((current, key) => {
        return current && typeof current === "object"
          ? current[key]
          : undefined;
      }, obj as any) as string | undefined;
    };

    // Set title
    let title = "NutriAI"; // Default fallback
    if (
      "metadata" in t &&
      t.metadata &&
      typeof t.metadata === "object" &&
      "title" in t.metadata
    ) {
      title = t.metadata.title as string;
    }

    if (config?.titleKey) {
      const pageTitle = getNestedValue(
        t as Record<string, any>,
        config.titleKey
      );
      if (pageTitle) {
        title = config.usePageTitle ? pageTitle : `${pageTitle} - NutriAI`;
      }
    }
    document.title = title;

    // Set description
    let description: string | undefined;
    if (
      "metadata" in t &&
      t.metadata &&
      typeof t.metadata === "object" &&
      "description" in t.metadata
    ) {
      description = t.metadata.description as string;
    }

    if (config?.descriptionKey) {
      const pageDescription = getNestedValue(
        t as Record<string, any>,
        config.descriptionKey
      );
      if (pageDescription) {
        description = pageDescription;
      }
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute("content", description);
    }

    // Set HTML lang attribute
    document.documentElement.lang = language;
  }, [language, t, config]);
}
