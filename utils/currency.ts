
import { Platform } from 'react-native';
import { Currency } from '../types';

type FormatOptions = {
  rtl?: boolean;
};

/**
 * Converts amount between SAR and SDG using the provided rate.
 * - If from === to, returns amount.
 * - If converting SAR -> SDG, amount * rate.
 * - If converting SDG -> SAR, amount / rate (guard against rate = 0).
 */
export function convertAmount(amount: number, from: Currency, to: Currency, rate: number): number {
  if (from === to) return amount;
  if (from === 'SAR' && to === 'SDG') return amount * (rate || 0);
  if (from === 'SDG' && to === 'SAR') return rate ? amount / rate : 0;
  return 0;
}

/**
 * Formats currency amount consistently for SAR and SDG.
 * Uses Intl.NumberFormat when available, otherwise falls back to a simple format.
 */
export function formatCurrency(value: number, currency: Currency, options?: FormatOptions): string {
  const rtl = options?.rtl ?? false;

  try {
    // Use a locale based on direction. Keeps the UI consistent with the selected language.
    const locale = rtl ? 'ar' : 'en';
    // Map currency codes to standard codes for Intl
    const code = currency === 'SAR' ? 'SAR' : 'SDG';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

    return formatted;
  } catch {
    // Fallback if Intl is not available (very rare)
    const amount = (Number.isFinite(value) ? value : 0).toFixed(2);
    // Put symbol according to direction to avoid awkward ordering
    if (rtl) {
      return `${amount} ${currency}`;
    }
    return `${currency} ${amount}`;
  }
}
