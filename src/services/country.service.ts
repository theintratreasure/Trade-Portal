import { Country } from "@/types/country";

/** Stable public dataset (REST Countries v3 is deprecated and no longer returns country payloads). */
const COUNTRIES_JSON_URL =
  "https://cdn.jsdelivr.net/gh/dr5hn/countries-states-cities-database@master/json/countries.json";

type CscCountryRow = {
  name: string;
  iso2: string;
  phonecode: string;
};

function dialCodeFromPhonecode(phonecode: string): string | null {
  const digits = phonecode.replace(/\D/g, "");
  if (!digits) return null;
  const trimmed = digits.replace(/^0+/, "") || "0";
  return `+${trimmed}`;
}

export const countryService = {
  getAll: async (): Promise<Country[]> => {
    const res = await fetch(COUNTRIES_JSON_URL);

    if (!res.ok) {
      throw new Error("Failed to fetch countries");
    }

    const data: CscCountryRow[] = await res.json();

    return data
      .map((c) => {
        const iso = c.iso2?.trim();
        if (!iso || iso.length !== 2) return null;

        const dialCode = dialCodeFromPhonecode(c.phonecode ?? "");
        if (!dialCode) return null;

        return {
          name: c.name,
          dialCode,
          flag: `https://flagcdn.com/w40/${iso.toLowerCase()}.png`,
        };
      })
      .filter((c): c is Country => Boolean(c))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};
