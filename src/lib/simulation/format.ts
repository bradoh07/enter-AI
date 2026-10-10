import { safeNumber } from "./math";
import type { CurrencyCode } from "./types";

const LOCALE_FOR_CURRENCY: Record<CurrencyCode, string> = {
  KRW: "ko-KR",
  USD: "en-US",
};

const resolveLocale = (currency: CurrencyCode, locale?: string): string =>
  locale && locale.trim().length > 0 ? locale : LOCALE_FOR_CURRENCY[currency];

const toNumber = (value: unknown): number => safeNumber(value);

/** Money with thousands separators, e.g. "₩1,250,000". */
export const formatCurrency = (
  value: unknown,
  currency: CurrencyCode,
  locale?: string,
  decimals = 0,
): string => {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat(resolveLocale(currency, locale), {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(decimals)}`;
  }
};

/**
 * Compact money for chart axes and KPI tiles, e.g. "1.2억" / "$1.2M".
 * Falls back to the full format when the runtime has no compact notation.
 */
export const formatCompactCurrency = (
  value: unknown,
  currency: CurrencyCode,
  locale?: string,
): string => {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat(resolveLocale(currency, locale), {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatCurrency(amount, currency, locale);
  }
};

export const formatNumber = (
  value: unknown,
  locale?: string,
  decimals = 0,
): string =>
  new Intl.NumberFormat(locale ?? "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toNumber(value));

export const formatPercent = (
  value: unknown,
  digits = 1,
  locale?: string,
): string =>
  `${new Intl.NumberFormat(locale ?? "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value))}%`;

/** Months rendered with one decimal, e.g. "18.4". */
export const formatMonths = (value: unknown, locale?: string): string =>
  new Intl.NumberFormat(locale ?? "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(toNumber(value));

export const resolveCurrencyLocale = resolveLocale;
