
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { commonStyles } from '../../styles/commonStyles';
import { useLocale } from '../../context/LocaleContext';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { getAllTransactions } from '../../data/backend';
import { Transaction } from '../../types';
import { formatCurrency, convertAmount } from '../../utils/currency';
import { DoughnutChart } from '../../components/DoughnutChart';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

export default function Dashboard() {
  const { colors } = useThemeColors();
  const { t, isRTL } = useLocale();
  const { rate, lastUpdated, loading, error } = useExchangeRate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getAllTransactions();
      setTransactions(data);
      console.log('Loaded transactions', data.length);
    };
    const unsub = router.addListener?.('focus', load);
    load();
    return () => {
      if (unsub) (unsub as any)();
    };
  }, []);

  const today = new Date();
  const startOfDayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfWeekDate = new Date(today);
  startOfWeekDate.setDate(today.getDate() - today.getDay());
  const startOfWeekMs = startOfWeekDate.getTime();
  const startOfMonthMs = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  const computeSummary = useCallback((from: number) => {
    const filtered = transactions.filter(tx => new Date(tx.date).getTime() >= from);
    let incomeSAR = 0, expenseSAR = 0, incomeSDG = 0, expenseSDG = 0;
    filtered.forEach(tx => {
      if (tx.currency === 'SAR') {
        if (tx.type === 'income') incomeSAR += tx.amount; else expenseSAR += tx.amount;
        const sdg = convertAmount(tx.amount, 'SAR', 'SDG', rate);
        if (tx.type === 'income') incomeSDG += sdg; else expenseSDG += sdg;
      } else {
        if (tx.type === 'income') incomeSDG += tx.amount; else expenseSDG += tx.amount;
        const sar = convertAmount(tx.amount, 'SDG', 'SAR', rate);
        if (tx.type === 'income') incomeSAR += sar; else expenseSAR += sar;
      }
    });
    return { incomeSAR, expenseSAR, incomeSDG, expenseSDG };
  }, [transactions, rate]);

  const daily = useMemo(() => computeSummary(startOfDayMs), [computeSummary, startOfDayMs]);
  const weekly = useMemo(() => computeSummary(startOfWeekMs), [computeSummary, startOfWeekMs]);
  const monthly = useMemo(() => computeSummary(startOfMonthMs), [computeSummary, startOfMonthMs]);

  const netSAR = daily.incomeSAR - daily.expenseSAR;
  const netSDG = daily.incomeSDG - daily.expenseSDG;

  const percentIncome = (daily.incomeSAR + daily.incomeSDG) === 0 ? 0 :
    (daily.incomeSAR + daily.incomeSDG) / (daily.incomeSAR + daily.incomeSDG + daily.expenseSAR + daily.expenseSDG);

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[commonStyles.content, { paddingHorizontal: 16, paddingTop: 20 }]}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('overview')}</Text>
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

        <View style={styles.grid}>
          <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('exchangeRate')}</Text>
            <Text style={[styles.rateText, { color: colors.text }]}>
              1 SAR = {loading ? t('loading') : error ? t('unavailable') : rate.toFixed(2)} SDG
            </Text>
            <Text style={[styles.updatedText, { color: colors.grey }]}>{t('updated')}: {lastUpdated ? new Date(lastUpdated).toLocaleString() : t('never')}</Text>
          </View>

          <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('today')}</Text>
            <Text style={[styles.value, { color: '#0B5' }]}>{formatCurrency(netSAR, 'SAR', { rtl: isRTL })} ({t('net')})</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>
              {t('income')}: {formatCurrency(daily.incomeSAR, 'SAR', { rtl: isRTL })} • {t('expenses')}: {formatCurrency(daily.expenseSAR, 'SAR', { rtl: isRTL })}
            </Text>
          </View>

          <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('today')} (SDG)</Text>
            <Text style={[styles.value, { color: '#0B5' }]}>{formatCurrency(netSDG, 'SDG', { rtl: isRTL })} ({t('net')})</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>
              {t('income')}: {formatCurrency(daily.incomeSDG, 'SDG', { rtl: isRTL })} • {t('expenses')}: {formatCurrency(daily.expenseSDG, 'SDG', { rtl: isRTL })}
            </Text>
          </View>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card, width: '100%' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('distributionToday')}</Text>
          <DoughnutChart
            size={180}
            strokeWidth={24}
            percentage={percentIncome}
            primaryColor={'#0B5'}
            secondaryColor={'#E53935'}
            centerLabel={`${Math.round(percentIncome * 100)}% ${t('income')}`}
          />
          <Text style={[styles.legend, { color: colors.text }]}>{t('income')} vs {t('expenses')}</Text>
        </View>

        <View style={styles.row}>
          <View style={[commonStyles.card, styles.flexItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('weekly')}</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>{t('income')}: {formatCurrency(weekly.incomeSAR, 'SAR', { rtl: isRTL })}</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>{t('expenses')}: {formatCurrency(weekly.expenseSAR, 'SAR', { rtl: isRTL })}</Text>
          </View>
          <View style={[commonStyles.card, styles.flexItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('monthly')}</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>{t('income')}: {formatCurrency(monthly.incomeSAR, 'SAR', { rtl: isRTL })}</Text>
            <Text style={[styles.sub, { color: colors.grey }]}>{t('expenses')}: {formatCurrency(monthly.expenseSAR, 'SAR', { rtl: isRTL })}</Text>
          </View>
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
  grid: { width: '100%', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  rateText: { fontSize: 18, fontWeight: '800' },
  updatedText: { fontSize: 12 },
  value: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 4 },
  legend: { marginTop: 8, textAlign: 'center' },
  row: { width: '100%', flexDirection: 'row', gap: 12 },
  flexItem: { flex: 1 },
});
