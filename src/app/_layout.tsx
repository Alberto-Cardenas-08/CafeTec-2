import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OfflineGate } from "@/components/offline-gate";
import { CafeProvider } from "@/context/cafe-context";
import { CartProvider } from "@/context/cart-context";
import { NetworkProvider } from "@/context/network-context";
import { NotificationBannerProvider } from "@/context/notification-banner-context";
import { OrdersProvider } from "@/context/orders-context";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NetworkProvider>
        <NotificationBannerProvider>
          <CartProvider>
            <OrdersProvider>
              <CafeProvider>
                <AnimatedSplashOverlay />
                <AppTabs />
                <OfflineGate />
              </CafeProvider>
            </OrdersProvider>
          </CartProvider>
        </NotificationBannerProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}
