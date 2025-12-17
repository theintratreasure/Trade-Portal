import { Country } from "@/types/country";

type RestCountryApiResponse = {
  name: { common: string };
  idd?: { root?: string; suffixes?: string[] };
  flags: { png: string };
};

export const countryService = {
  getAll: async (): Promise<Country[]> => {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,idd,flags"
    );

    if (!res.ok) {
      throw new Error("Failed to fetch countries");
    }

    const data: RestCountryApiResponse[] = await res.json();

    return data
      .map((c) => {
        if (!c.idd?.root || !c.idd.suffixes?.[0]) return null;

        return {
          name: c.name.common,
          dialCode: `${c.idd.root}${c.idd.suffixes[0]}`,
          flag: c.flags.png,
        };
      })
      .filter((c): c is Country => Boolean(c))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};
