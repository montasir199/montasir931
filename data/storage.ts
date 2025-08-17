
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, Transaction } from '../types';

const TX_KEY = 'transactions';
const SETTINGS_KEY = 'settings';

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(TX_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch (e) {
    console.log('getAllTransactions error', e);
    return [];
  }
}

export async function saveTransactions(list: Transaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(list));
  } catch (e) {
    console.log('saveTransactions error', e);
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Settings) : {};
  } catch (e) {
    console.log('getSettings error', e);
    return {};
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.log('saveSettings error', e);
  }
}
