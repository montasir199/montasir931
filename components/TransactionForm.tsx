
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Transaction, Currency, TxType } from '../types';
import { useThemeColors } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { commonStyles } from '../styles/commonStyles';

interface Props {
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  saving?: boolean;
  initialType?: TxType;
}

export function TransactionForm({ onSubmit, saving = false, initialType = 'expense' }: Props) {
  const { colors } = useThemeColors();
  const { t, isRTL } = useLocale();

  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const canSubmit = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 && !!currency && !!type;
  }, [amount, currency, type]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const n = Number(amount);
    const data: Omit<Transaction, 'id'> = {
      type,
      amount: n,
      currency,
      category,
      date,
      note: note.trim() || undefined,
    };
    console.log('Submitting transaction', data);
    onSubmit(data);
  };

  const TypeChip = ({ label, value }: { label: string; value: TxType }) => (
    <TouchableOpacity
      onPress={() => setType(value)}
      style={[
        styles.chip,
        {
          borderColor: colors.border,
          backgroundColor: type === value ? colors.accent : 'transparent',
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={{ color: type === value ? '#fff' : colors.text, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );

  const CurrencyChip = ({ label, value }: { label: string; value: Currency }) => (
    <TouchableOpacity
      onPress={() => setCurrency(value)}
      style={[
        styles.chip,
        {
          borderColor: colors.border,
          backgroundColor: currency === value ? colors.accent : 'transparent',
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={{ color: currency === value ? '#fff' : colors.text, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('type')}</Text>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TypeChip label={t('incomeType')} value="income" />
          <TypeChip label={t('expenseType')} value="expense" />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('currency')}</Text>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <CurrencyChip label={t('SAR')} value="SAR" />
          <CurrencyChip label={t('SDG')} value="SDG" />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('amount')}</Text>
        <TextInput
          keyboardType={Platform.select({ ios: 'decimal-pad', android: 'decimal-pad', default: 'numeric' })}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.grey}
          style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('category')}</Text>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder={t('category')}
          placeholderTextColor={colors.grey}
          style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('date')}</Text>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TextInput
            value={new Date(date).toLocaleString()}
            editable={false}
            style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
          />
          <TouchableOpacity
            onPress={() => setDate(new Date().toISOString())}
            style={[styles.chip, { borderColor: colors.border, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.text }}>{t('today')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t('note')}</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('note')}
          placeholderTextColor={colors.grey}
          multiline
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, height: 80, textAlignVertical: 'top', textAlign: isRTL ? 'right' : 'left' },
          ]}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!canSubmit || saving}
        style={[
          styles.submitBtn,
          { backgroundColor: canSubmit && !saving ? colors.accent : colors.border },
        ]}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>{t('submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', alignItems: 'center', gap: 8 },
  field: { marginTop: 12 },
  label: { fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  submitBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start', marginTop: 12 },
});
