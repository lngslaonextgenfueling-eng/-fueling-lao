import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ScanScreen from '@/screens/ScanScreen';
import QueueScreen from '@/screens/QueueScreen';
import PumpStatusScreen from '@/screens/PumpStatusScreen';
import SuccessScreen from '@/screens/SuccessScreen';

import { RootStackParamList, TabParamList } from './types';
import { colors } from '@/theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Scan' ? 'scan' : route.name === 'Queue' ? 'list' : 'speedometer';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'ສະແກນ' }} />
      <Tab.Screen name="Queue" component={QueueScreen} options={{ title: 'ຄິວ' }} />
      <Tab.Screen name="Pumps" component={PumpStatusScreen} options={{ title: 'ຫົວຈ່າຍ' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ title: '', gestureEnabled: false, headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
