import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '@/screens/HomeScreen';
import LoyaltyScreen from '@/screens/LoyaltyScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import FuelSelectScreen from '@/screens/FuelSelectScreen';
import PaymentScreen from '@/screens/PaymentScreen';
import QrVerificationScreen from '@/screens/QrVerificationScreen';
import TopUpScreen from '@/screens/TopUpScreen';

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
            route.name === 'Home'
              ? 'home'
              : route.name === 'Loyalty'
              ? 'medal'
              : 'time';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'ໜ້າຫຼັກ' }} />
      <Tab.Screen name="Loyalty" component={LoyaltyScreen} options={{ title: 'Loyalty' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'ປະຫວັດ' }} />
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
      <Stack.Screen name="FuelSelect" component={FuelSelectScreen} options={{ title: '' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: '' }} />
      <Stack.Screen name="TopUp" component={TopUpScreen} options={{ title: '' }} />
      <Stack.Screen
        name="QrVerification"
        component={QrVerificationScreen}
        options={{ title: '', gestureEnabled: false, headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
