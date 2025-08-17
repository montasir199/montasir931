
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tries multiple endpoints for robustness
const providers = [
  (base: string, symbol: string) => `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbol)}`,
  (base: string) => `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
];

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const parseRate = useCallback(async (): Promise<number> => {
    // Prefer direct SAR -> SDG
    try {
      const r1 = await fetch(providers[0]('SAR', 'SDG'));
      const j1 = await r1.json();
      if (j1 && j1.rates && j1.rates.SDG) return j1.rates.SDG as number;
    } catch (e) {
      console.log('Provider 1 failed', e);
    }
    // Fallback: from open.er-api.com
    try {
      const r2 = await fetch(providers[1]('SAR'));
      const j2 = await r2.json();
      if (j2 && j2.rates && j2.rates.SDG) return j2.rates.SDG as number;
    } catch (e) {
      console.log('Provider 2 failed', e);
    }
    // Cross rate via USD if needed
    try {
      const [rSAR, rSDG] = await Promise.all([
        fetch(providers[1]('SAR')).then(r => r.json()),
        fetch(providers[1]('SDG')).then(r => r.json())
      ]);
      if (rSAR?.rates?.USD && rSDG?.rates?.USD) {
        const sarToUSD = rSAR.rates.USD as number;
        const sdgToUSD = rSDG.rates.USD as number;
        if (sdgToUSD !== 0) return sarToUSD / sdgToUSD;
      }
    } catch (e) {
      console.log('Cross rate failed', e);
    }
    throw new Error('No rate available');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await AsyncStorage.getItem('rateSARSDG');
      if (cached) {
        const obj = JSON.parse(cached);
        setRate(obj.rate);
        setLastUpdated(obj.lastUpdated);
      }
      const r = await parseRate();
      setRate(r);
      const ts = Date.now();
      setLastUpdated(ts);
      await AsyncStorage.setItem('rateSARSDG', JSON.stringify({ rate: r, lastUpdated: ts }));
    } catch (e) {
      console.log('Rate fetch error', e);
      setError('failed');
    } finally {
      setLoading(false);
    }
  }, [parseRate]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  return { rate, lastUpdated, loading, error, refresh: load };
}
