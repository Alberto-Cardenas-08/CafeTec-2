import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { CartProvider } from "@/context/cart-context";
import { OrdersProvider } from "@/context/orders-context";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CartProvider>
        <OrdersProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </OrdersProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
