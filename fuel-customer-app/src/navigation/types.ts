import { NavigatorScreenParams } from '@react-navigation/native';
import { FuelType, FuelMode } from '@/types';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  TopUp: undefined;
  FuelSelect: undefined;
  Payment: undefined;
  QrVerification: undefined;
};

export type TabParamList = {
  Home: undefined;
  Loyalty: undefined;
  History: undefined;
};

export interface FuelSelectResult {
  fuelType: FuelType;
  mode: FuelMode;
  inputValue: number;
}
