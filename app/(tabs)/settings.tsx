
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useThemeColors, useTheme } from '../../context/ThemeContext';
import { commonStyles } from '../../styles/commonStyles';
import { useLocale } from '../../context/LocaleContext';
import { getSettings, saveSettings, syncLocalToSupabase } from '../../data/backend';
import { router } from 'expo-router';
import { exportCSV, exportPDF } from '../../utils/export';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { colors } = useThemeColors();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale, isRTL } = useLocale();
  const { user, signIn, signUp, signOut } = useAuth();

  const [budgetSAR, setBudgetSAR] = useState<number>(0);
  const [budgetSDG, setBudgetSDG] = useState<number>(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setBudgetSAR(s.budgetSAR ?? 0);
      setBudgetSDG(s.budgetSDG ?? 0);
    };
    load();
  }, []);

  const saveBudget = async () => {
    await saveSettings({ budgetSAR, budgetSDG, theme, locale });
    Alert.alert(t('saved'), t('budgetSaved'));
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('enterEmailPassword'));
      return;
    }
    await signIn(email.trim(), password);
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('enterEmailPassword'));
      return;
    }
    await signUp(email.trim(), password);
  };

  const handleSync = async () => {
    const res = await syncLocalToSupabase();
    Alert.alert(t('sync'), `${t('synced')}: ${res.count}`);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[commonStyles.content, { paddingHorizontal: 16, paddingTop: 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings')}</Text>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('account')}</Text>
          {user ? (
            <>
              <Text style={{ color: colors.text }}>{t('connectedAs')} {user.email || user.id}</Text>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={handleSync} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>{t('syncNow')}</Text></TouchableOpacity>
                <TouchableOpacity onPress={signOut} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>{t('logout')}</Text></TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  placeholder={t('email')}
                  placeholderTextColor={colors.grey}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                />
              </View>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  placeholder={t('password')}
                  placeholderTextColor={colors.grey}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                />
              </View>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={handleLogin} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>{t('login')}</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSignup} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>{t('signup')}</Text></TouchableOpacity>
              </View>
              <Text style={{ color: colors.grey, marginTop: 6 }}>{t('enableSupabase')}</Text>
            </>
          )}
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('language')}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => setLocale('ar')}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: locale === 'ar' ? colors.accent + '22' : 'transparent' }]}
            >
              <Text style={{ color: colors.text }}>{t('arabic')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLocale('en')}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: locale === 'en' ? colors.accent + '22' : 'transparent' }]}
            >
              <Text style={{ color: colors.text }}>{t('english')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('appearance')}</Text>
          <View style={[styles.row, { justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={{ color: colors.text }}>{theme === 'light' ? t('light') : t('dark')}</Text>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('budgets')}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => setBudgetSAR(prev => Math.max(0, prev - 100))}
              style={[styles.btn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>-100 SAR</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{budgetSAR} SAR</Text>
            <TouchableOpacity
              onPress={() => setBudgetSAR(prev => prev + 100)}
              style={[styles.btn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>+100 SAR</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => setBudgetSDG(prev => Math.max(0, prev - 1000))}
              style={[styles.btn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>-1000 SDG</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{budgetSDG} SDG</Text>
            <TouchableOpacity
              onPress={() => setBudgetSDG(prev => prev + 1000)}
              style={[styles.btn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>+1000 SDG</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={saveBudget} style={[styles.saveBtn, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('dataExport')}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={() => exportCSV()} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>CSV</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => exportPDF()} style={[styles.btn, { borderColor: colors.border }]}><Text style={{ color: colors.text }}>PDF</Text></TouchableOpacity>
          </View>
          <Text style={{ color: colors.grey, marginTop: 6 }}>{t('exportHint')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  row: { width: '100%', alignItems: 'center', gap: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  input: { padding: 10, borderWidth: 1, borderRadius: 10, flex: 1, minWidth: 140 },
});
