
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { commonStyles } from '../styles/commonStyles';
import { useLocale } from '../context/LocaleContext';
import { Transaction, TxType } from '../types';
import { addTransaction, getAllTransactions, getSettings } from '../data/backend';
import { TransactionForm } from '../components/TransactionForm';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { convertAmount } from '../utils/currency';
import { router, useLocalSearchParams } from 'expo-router';

export default function AddTransaction() {
  const { colors } = useThemeColors();
  const { t } = useLocale();
  const { rate } = useExchangeRate();
  const [saving, setSaving] = useState(false);
  const params = useLocalSearchParams();
  const initialType = (typeof params.type === 'string' && (params.type === 'income' || params.type === 'expense') ? params.type : 'expense') as TxType;

  useEffect(() => {
    console.log('AddTransaction mounted');
  }, []);

  const onSubmit = async (data: Omit<Transaction, 'id'>) => {
    try {
      setSaving(true);
      const created = await addTransaction(data);
      if (!created) throw new Error('Not created');

      const list = await getAllTransactions();
      const settings = await getSettings();
      // Budget alerts per currency
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const monthExpenses = list.filter(x => x.type === 'expense' && new Date(x.date).getTime() >= monthStart);
      const sumSAR = monthExpenses.reduce((a, x) => a + (x.currency === 'SAR' ? x.amount : convertAmount(x.amount, 'SDG', 'SAR', rate)), 0);
      const sumSDG = monthExpenses.reduce((a, x) => a + (x.currency === 'SDG' ? x.amount : convertAmount(x.amount, 'SAR', 'SDG', rate)), 0);

      let alertMsg = '';
      if (settings.budgetSAR && sumSAR > settings.budgetSAR) alertMsg += t('budgetExceededSAR') + '\n';
      if (settings.budgetSDG && sumSDG > settings.budgetSDG) alertMsg += t('budgetExceededSDG') + '\n';
      if (alertMsg) Alert.alert(t('budgetAlert'), alertMsg.trim());

      router.back();
    } catch (e) {
      console.log('Failed to save transaction', e);
      Alert.alert(t('error'), t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[commonStyles.content, { paddingHorizontal: 16, paddingTop: 16, width: '100%', maxWidth: 700 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('addTransaction')}</Text>
        <TransactionForm onSubmit={onSubmit} saving={saving} initialType={initialType} />
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.cancelBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
});
