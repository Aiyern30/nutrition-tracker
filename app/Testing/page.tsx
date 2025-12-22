"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FatSecretFood {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_type: string;
  food_description: string;
}

const REGION_OPTIONS = [
  { value: "MY", label: "Malaysia" },
  // Add more regions if needed
];
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  // Add more languages if needed
];

export default function FatSecretFoodPage() {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FatSecretFood[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FatSecretFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [region, setRegion] = useState("MY");
  const [language, setLanguage] = useState("en");

  // Get unique brands and types from current foods
  const brands = Array.from(
    new Set(foods.filter((f) => f.brand_name).map((f) => f.brand_name!))
  ).sort();

  const types = Array.from(new Set(foods.map((f) => f.food_type))).sort();

  // Initial load on mount
  useEffect(() => {
    fetchFoods("chicken rice", region, language); // Default search term and region/language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when region/language changes
  useEffect(() => {
    fetchFoods(query || "chicken rice", region, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, language]);

  // Apply filters whenever selection changes
  useEffect(() => {
    let filtered = foods;

    if (selectedType) {
      filtered = filtered.filter((f) => f.food_type === selectedType);
    }

    if (selectedBrand) {
      filtered = filtered.filter((f) => f.brand_name === selectedBrand);
    }

    setFilteredFoods(filtered);
  }, [selectedType, selectedBrand, foods]);

  async function fetchFoods(
    search: string,
    regionParam: string = region,
    languageParam: string = language
  ) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/fatsecret/foods?query=${encodeURIComponent(
          search
        )}&region=${regionParam}&language=${languageParam}`
      );
      const data = await res.json();
      const list = data?.foods?.food ?? [];
      setFoods(list);
      setFilteredFoods(list);
      setSelectedType(null);
      setSelectedBrand(null);
    } catch (error) {
      console.error("Error fetching foods:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (query.trim()) {
      fetchFoods(query, region, language);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function toggleType(type: string) {
    setSelectedType(selectedType === type ? null : type);
  }

  function toggleBrand(brand: string) {
    setSelectedBrand(selectedBrand === brand ? null : brand);
  }

  function resetFilters() {
    setSelectedType(null);
    setSelectedBrand(null);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Food Search</h1>

      {/* Region & Language Selectors */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold mb-1">Region</label>
          <select
            className="border rounded px-2 py-1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Language</label>
          <select
            className="border rounded px-2 py-1"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search food..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Filters Section */}
      {foods.length > 0 && (
        <div className="space-y-4">
          {/* Type Filters */}
          {types.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Food Type:</div>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <Badge
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => toggleType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Brand Filters */}
          {brands.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Brand:</div>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Badge
                    key={brand}
                    variant={selectedBrand === brand ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => toggleBrand(brand)}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {(selectedType || selectedBrand) && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Results Count */}
      {foods.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredFoods.length} of {foods.length} results
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      )}

      {/* Food Results */}
      <div className="space-y-3">
        {filteredFoods.map((food) => (
          <Card
            key={food.food_id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="font-semibold text-lg">{food.food_name}</div>
              <div className="text-sm text-muted-foreground mb-2">
                {food.brand_name || "Generic"} · {food.food_type}
              </div>
              <div className="text-sm">{food.food_description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {!loading && filteredFoods.length === 0 && foods.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No foods match the selected filters
        </div>
      )}
    </div>
  );
}
