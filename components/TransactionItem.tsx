
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { useThemeColors } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { commonStyles } from '../styles/commonStyles';
import { formatCurrency } from '../utils/currency';

export function TransactionItem({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const { colors } = useThemeColors();
  const { isRTL, t } = useLocale();

  return (
    <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.amount, { color: tx.type === 'income' ? '#0B5' : '#E53935' }]}>
          {formatCurrency(tx.amount, tx.currency, { rtl: isRTL })}
        </Text>
        <Text style={[styles.meta, { color: colors.grey }]}>
          {tx.category || t('uncategorized')} • {new Date(tx.date).toLocaleString()}
        </Text>
      </View>
      {tx.note ? <Text style={{ color: colors.text, marginTop: 6 }}>{tx.note}</Text> : null}
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <TouchableOpacity onPress={onDelete} style={[styles.deleteBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
          <Text style={{ color: colors.text }}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', alignItems: 'center', justifyContent: 'space-between' },
  amount: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 12 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
});
