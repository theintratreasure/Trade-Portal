"use client";

import { useQuery } from "@tanstack/react-query";
import { countryService } from "@/services/country.service";
import { Country } from "@/types/country";

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: countryService.getAll,
    staleTime: Infinity,
    gcTime: Infinity, // ✅ cacheTime → gcTime
  });
}
