"use client";

export const TRADE_LOGIN_REMEMBER_KEY = "trade-login-remembered";
const TRADE_LOGIN_ACCOUNTS_KEY = "trade-login-accounts";

export type SavedTradeAccount = {
  account_number: string;
  password: string;
  updatedAt: string;
};

type SavedTradeAccountInput = {
  account_number?: unknown;
  password?: unknown;
  updatedAt?: unknown;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeAccount(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseSavedAccount(value: unknown): SavedTradeAccount | null {
  if (!value || typeof value !== "object") return null;
  const input = value as SavedTradeAccountInput;

  const account_number = normalizeAccount(input.account_number);
  const password = normalizePassword(input.password);
  const updatedAtRaw = input.updatedAt;
  const updatedAt =
    typeof updatedAtRaw === "string" && updatedAtRaw
      ? updatedAtRaw
      : new Date(0).toISOString();

  if (!account_number || !password) return null;
  return { account_number, password, updatedAt };
}

export function getSavedTradeAccounts(): SavedTradeAccount[] {
  if (!canUseStorage()) return [];

  const parsedAccounts: SavedTradeAccount[] = [];
  const raw = localStorage.getItem(TRADE_LOGIN_ACCOUNTS_KEY);

  if (raw) {
    try {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        for (const item of items) {
          const parsed = parseSavedAccount(item);
          if (parsed) parsedAccounts.push(parsed);
        }
      }
    } catch {
      localStorage.removeItem(TRADE_LOGIN_ACCOUNTS_KEY);
    }
  }

  // Backward compatibility: migrate old single remembered credential.
  const legacy = getDefaultRememberedTradeLogin();
  if (legacy && !parsedAccounts.some((x) => x.account_number === legacy.account_number)) {
    parsedAccounts.push({
      account_number: legacy.account_number,
      password: legacy.password,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(TRADE_LOGIN_ACCOUNTS_KEY, JSON.stringify(parsedAccounts));
  }

  return parsedAccounts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSavedTradeAccount(accountNumber: string): SavedTradeAccount | null {
  const account = normalizeAccount(accountNumber);
  if (!account) return null;
  return getSavedTradeAccounts().find((x) => x.account_number === account) || null;
}

export function saveTradeAccount(accountNumber: string, password: string) {
  if (!canUseStorage()) return;

  const account = normalizeAccount(accountNumber);
  const pwd = normalizePassword(password);
  if (!account || !pwd) return;

  const current = getSavedTradeAccounts().filter((x) => x.account_number !== account);
  const next: SavedTradeAccount = {
    account_number: account,
    password: pwd,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(TRADE_LOGIN_ACCOUNTS_KEY, JSON.stringify([next, ...current]));
}

export function removeTradeAccount(accountNumber: string) {
  if (!canUseStorage()) return;
  const account = normalizeAccount(accountNumber);
  if (!account) return;

  const next = getSavedTradeAccounts().filter((x) => x.account_number !== account);
  localStorage.setItem(TRADE_LOGIN_ACCOUNTS_KEY, JSON.stringify(next));
}

export function setDefaultRememberedTradeLogin(accountNumber: string, password: string) {
  if (!canUseStorage()) return;
  const account = normalizeAccount(accountNumber);
  const pwd = normalizePassword(password);
  if (!account || !pwd) return;
  localStorage.setItem(
    TRADE_LOGIN_REMEMBER_KEY,
    JSON.stringify({ account_number: account, password: pwd })
  );
}

export function getDefaultRememberedTradeLogin(): {
  account_number: string;
  password: string;
} | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(TRADE_LOGIN_REMEMBER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const account_number = normalizeAccount(parsed?.account_number);
    const password = normalizePassword(parsed?.password);
    if (!account_number || !password) return null;
    return { account_number, password };
  } catch {
    localStorage.removeItem(TRADE_LOGIN_REMEMBER_KEY);
    return null;
  }
}

export function clearDefaultRememberedTradeLogin() {
  if (!canUseStorage()) return;
  localStorage.removeItem(TRADE_LOGIN_REMEMBER_KEY);
}
