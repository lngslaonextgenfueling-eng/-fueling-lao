import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from '@/navigation/RootNavigator';
import LoginScreen from '@/screens/LoginScreen';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    border: colors.border,
    primary: colors.primary,
    text: colors.textPrimary,
  },
};

function Root() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!session) return <LoginScreen />;
  return (
    // key = user id → ລ້າງຂໍ້ມູນທັງໝົດເມື່ອປ່ຽນບັນຊີ
    <AppProvider key={session.user.id} userId={session.user.id}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
