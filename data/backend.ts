
import { supabase } from '../app/integrations/supabase/client';
import { Transaction, Settings } from '../types';
import * as local from './storage';

export async function getSessionUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch (e) {
    console.log('getSessionUserId error', e);
    return null;
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const userId = await getSessionUserId();
  if (!userId) {
    return await local.getAllTransactions();
  }
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.log('Supabase getAllTransactions error', error);
    // fallback to local
    return await local.getAllTransactions();
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category || '',
    date: row.date,
    note: row.note || undefined,
  })) as Transaction[];
}

export async function addTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    const list = await local.getAllTransactions();
    const tx: Transaction = { ...data, id: `${Date.now()}` };
    list.push(tx);
    await local.saveTransactions(list);
    return tx;
  }

  const payload = {
    user_id: userId,
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    category: data.category || null,
    date: data.date,
    note: data.note || null,
  };

  const { data: inserted, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.log('Supabase addTransaction error', error);
    return null;
  }

  return {
    id: inserted.id,
    type: inserted.type,
    amount: Number(inserted.amount),
    currency: inserted.currency,
    category: inserted.category || '',
    date: inserted.date,
    note: inserted.note || undefined,
  } as Transaction;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) {
    const all = await local.getAllTransactions();
    const newList = all.filter(x => x.id !== id);
    await local.saveTransactions(newList);
    return true;
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) {
    console.log('Supabase deleteTransaction error', error);
    return false;
  }
  return true;
}

export async function getSettings(): Promise<Settings> {
  const userId = await getSessionUserId();
  if (!userId) {
    return await local.getSettings();
  }
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.log('Supabase getSettings error', error);
    return await local.getSettings();
  }

  if (!data) return {};
  return {
    budgetSAR: data.budget_sar ?? undefined,
    budgetSDG: data.budget_sdg ?? undefined,
    theme: (data.theme as any) ?? undefined,
    locale: (data.locale as any) ?? undefined,
  };
}

export async function saveSettings(s: Settings): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) {
    await local.saveSettings(s);
    return;
  }
  const payload = {
    user_id: userId,
    budget_sar: s.budgetSAR ?? null,
    budget_sdg: s.budgetSDG ?? null,
    theme: s.theme ?? null,
    locale: s.locale ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('user_settings').upsert(payload).eq('user_id', userId);
  if (error) {
    console.log('Supabase saveSettings error', error);
    // best effort fallback to local cache
    await local.saveSettings(s);
  }
}

export async function syncLocalToSupabase(): Promise<{ count: number }> {
  const userId = await getSessionUserId();
  if (!userId) return { count: 0 };

  const localTxs = await local.getAllTransactions();
  if (!localTxs.length) return { count: 0 };

  // Insert all local transactions into Supabase
  const rows = localTxs.map(t => ({
    user_id: userId,
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    category: t.category || null,
    date: t.date,
    note: t.note || null,
  }));

  const { data, error } = await supabase.from('transactions').insert(rows).select('id');
  if (error) {
    console.log('Supabase syncLocalToSupabase error', error);
    return { count: 0 };
  }

  return { count: data?.length || 0 };
}
