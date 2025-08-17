
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { commonStyles } from '../../styles/commonStyles';
import { useLocale } from '../../context/LocaleContext';
import { getAllTransactions } from '../../data/backend';
import { deleteTransaction as deleteTxBackend } from '../../data/backend';
import { Transaction } from '../../types';
import { TransactionItem } from '../../components/TransactionItem';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

export default function TransactionsScreen() {
  const { colors } = useThemeColors();
  const { t, isRTL } = useLocale();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      const data = await getAllTransactions();
      setTransactions(data);
    };
    const unsub = router.addListener?.('focus', load);
    load();
    return () => { if (unsub) (unsub as any)(); };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => set.add(tx.category || t('uncategorized')));
    return [t('all'), ...Array.from(set)];
  }, [transactions, t]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchType = type === 'all' || tx.type === type;
      const matchCategory = category === t('all') || category === 'all' || (tx.category || t('uncategorized')) === category;
      const q = query.trim().toLowerCase();
      const matchQuery = q === '' || tx.note?.toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
      return matchType && matchCategory && matchQuery;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, type, category, query, t]);

  const deleteTx = async (id: string) => {
    await deleteTxBackend(id);
    const data = await getAllTransactions();
    setTransactions(data);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[commonStyles.content, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('transactions')}</Text>
          <View style={[styles.addRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => router.push('/add-transaction?type=income')}
              style={[styles.addBtn, { backgroundColor: '#0B5' }]}
              activeOpacity={0.8}
            >
              <Icon name="add" size={20} />
              <Text style={styles.addText}>{t('addIncome')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/add-transaction?type=expense')}
              style={[styles.addBtn, { backgroundColor: '#E53935' }]}
              activeOpacity={0.8}
            >
              <Icon name="add" size={20} />
              <Text style={styles.addText}>{t('addExpense')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.filters, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TextInput
              placeholder={t('search')}
              placeholderTextColor={colors.grey}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            />
            <TouchableOpacity
              onPress={() => setType(type === 'all' ? 'income' : type === 'income' ? 'expense' : 'all')}
              style={[styles.chip, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>
                {type === 'all' ? t('all') : type === 'income' ? t('income') : t('expenses')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const idx = categories.indexOf(category === 'all' ? t('all') : category);
                const next = categories[(idx + 1) % categories.length];
                setCategory(next);
              }}
              style={[styles.chip, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>{category}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ width: '100%' }}>
          {filtered.map(tx => (
            <TransactionItem key={tx.id} tx={tx} onDelete={() => deleteTx(tx.id)} />
          ))}
          {filtered.length === 0 && (
            <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.grey }}>{t('noResults')}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  addRow: { alignItems: 'center', gap: 8, display: 'contents' as any },
  addBtn: { flexDirection: 'row', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, display: 'contents' as any },
  addText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  filters: { alignItems: 'center', gap: 8 },
  input: { padding: 10, borderWidth: 1, borderRadius: 10, flex: 1, minWidth: 140 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
});
