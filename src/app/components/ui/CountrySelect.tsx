"use client";

import { useMemo, useState, useRef } from "react";
import { useCountries } from "@/hooks/useCountries";
import { Country } from "@/types/country";
import { Search } from "lucide-react";

type Props = {
  value: Country;
  onChange: (c: Country) => void;
};

export function CountrySelect({ value, onChange }: Props) {
  const { data: countries } = useCountries();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = useMemo(() => {
    if (!countries) return [];
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countries, search]);

  /* ---------------- open / close helpers ---------------- */
  const openDropdown = () => {
    setOpen(true);
    setActiveIndex(0);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  };

  const closeDropdown = () => {
    setOpen(false);
    setSearch("");
  };

  /* ---------------- keyboard handling ---------------- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    if (e.key === "Escape") {
      closeDropdown();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, filtered.length - 1)
      );
      itemRefs.current[activeIndex + 1]?.scrollIntoView({
        block: "nearest",
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      itemRefs.current[activeIndex - 1]?.scrollIntoView({
        block: "nearest",
      });
    }

    if (e.key === "Enter") {
      const c = filtered[activeIndex];
      if (c) {
        onChange(c);
        closeDropdown();
      }
    }
  };

  /* ---------------- outside click (focus based) ---------------- */
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      open &&
      containerRef.current &&
      !containerRef.current.contains(
        e.relatedTarget as Node
      )
    ) {
      closeDropdown();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="relative w-28"
    >
      {/* SELECT BUTTON */}
      <button
        type="button"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        className="
          flex w-full items-center gap-2 rounded-lg
          border border-[var(--border-glass)]
          bg-[var(--bg-card)] px-3 py-2 text-sm
        "
      >
        <img
          src={value.flag}
          alt={value.name}
          className="h-4 w-6 rounded-sm"
        />
        <span>{value.dialCode}</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          tabIndex={-1}
          className="
            absolute z-50 mt-2 w-72 rounded-xl
            border border-[var(--border-glass)]
            bg-[var(--bg-card)] shadow-2xl
          "
        >
          {/* SEARCH */}
          <div className="flex items-center gap-2 border-b border-[var(--border-glass)] px-3 py-2">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search country"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* LIST */}
          <div className="max-h-64 overflow-auto">
            {filtered.map((c, i) => (
              <button
                key={c.name}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => {
                  onChange(c);
                  closeDropdown();
                }}
                className={`
                  flex w-full items-center gap-3 px-3 py-2 text-sm
                  ${
                    i === activeIndex
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }
                `}
              >
                <img
                  src={c.flag}
                  className="h-4 w-6 rounded-sm"
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-[var(--text-muted)]">
                  {c.dialCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
