import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from '@/navigation/RootNavigator';
import LoginScreen from '@/screens/LoginScreen';
import { StaffProvider } from '@/context/StaffContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/theme';
import { StaffProfile } from '@/types';

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

function Spinner() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

function Root() {
  const { session, loading, signOut } = useAuth();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    if (!session) {
      setStaff(null);
      return;
    }
    setChecking(true);
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, station_id, stations(name)')
        .eq('id', session.user.id)
        .single();
      const role = data?.role;
      if (!data || !['staff', 'manager', 'admin'].includes(role) || !data.station_id) {
        setNotice(
          !data || role === 'customer'
            ? 'ບັນຊີນີ້ຍັງບໍ່ມີສິດພະນັກງານ — ໃຫ້ຜູ້ຈັດການແຕ່ງຕັ້ງໃນ Dashboard ກ່ອນ'
            : 'ບັນຊີນີ້ຍັງບໍ່ໄດ້ກຳນົດປໍ້າປະຈຳ — ໃຫ້ຜູ້ຈັດການກຳນົດໃນ Dashboard'
        );
        await signOut();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stationName = (data as any).stations?.name ?? data.station_id;
        setNotice(undefined);
        setStaff({ id: data.id, name: data.full_name, role, stationId: data.station_id, stationName });
      }
      setChecking(false);
    })();
  }, [session, signOut]);

  if (loading || checking) return <Spinner />;
  if (!session || !staff) return <LoginScreen notice={notice} />;
  return (
    <StaffProvider key={staff.id} staff={staff}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </StaffProvider>
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
