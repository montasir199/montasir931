
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { setupErrorLogging } from '../utils/errorLogger';
import { commonStyles } from '../styles/commonStyles';
import { ThemeProvider } from '../context/ThemeContext';
import { LocaleProvider } from '../context/LocaleContext';
import { AuthProvider } from '../context/AuthContext';

const STORAGE_KEY = 'emulated_device';

export default function RootLayout() {
  const actualInsets = useSafeAreaInsets();
  const [storedEmulate, setStoredEmulate] = useState<string | null>(null);

  useEffect(() => {
    setupErrorLogging();
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setStoredEmulate(stored);
    }
  }, []);

  let insetsToUse = actualInsets;
  if (Platform.OS === 'web') {
    const simulatedInsets = {
      ios: { top: 47, bottom: 20, left: 0, right: 0 },
      android: { top: 40, bottom: 0, left: 0, right: 0 },
    } as const;
    const deviceToEmulate = storedEmulate;
    insetsToUse = deviceToEmulate ? (simulatedInsets as any)[deviceToEmulate] || actualInsets : actualInsets;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <SafeAreaView
              style={[
                commonStyles.wrapper,
                {
                  paddingTop: insetsToUse.top,
                  paddingBottom: insetsToUse.bottom,
                  paddingLeft: insetsToUse.left,
                  paddingRight: insetsToUse.right,
                },
              ]}
            >
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false, animation: 'default' }} />
            </SafeAreaView>
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
