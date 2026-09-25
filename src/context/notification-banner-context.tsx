import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Banner = { title: string; body: string };

type NotificationBannerContextValue = {
  showBanner: (banner: Banner) => void;
};

const NotificationBannerContext = createContext<NotificationBannerContextValue | null>(null);

export function NotificationBannerProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [translate] = useState(() => new Animated.Value(-140));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translate, { toValue: -140, duration: 220, useNativeDriver: true }).start(() => {
      setBanner(null);
    });
  }, [translate]);

  const showBanner = useCallback((next: Banner) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBanner(next);
    translate.setValue(-140);
    try {
      Vibration.vibrate(180);
    } catch {
      /* web */
    }
    Animated.spring(translate, { toValue: 0, useNativeDriver: true, friction: 8, tension: 80 }).start();
    hideTimer.current = setTimeout(hide, 5200);
  }, [hide, translate]);

  const value = useMemo(() => ({ showBanner }), [showBanner]);

  return (
    <NotificationBannerContext.Provider value={value}>
      {children}
      {banner ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { paddingTop: Math.max(insets.top, 10), transform: [{ translateY: translate }] }]}
        >
          <Pressable onPress={hide} style={styles.card}>
            <Image source={require("@/assets/images/icon.png")} style={styles.icon} />
            <View style={styles.copy}>
              <View style={styles.topRow}>
                <Text style={styles.app}>CAFETEC</Text>
                <Text style={styles.now}>ahora</Text>
              </View>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{banner.body}</Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </NotificationBannerContext.Provider>
  );
}

export function useNotificationBanner() {
  const context = useContext(NotificationBannerContext);
  if (!context) throw new Error("useNotificationBanner debe usarse dentro de NotificationBannerProvider.");
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 80,
    paddingHorizontal: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(28, 22, 18, 0.96)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  copy: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  app: {
    color: "#d7c4b6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  now: {
    color: "#a08a7a",
    fontSize: 11,
  },
  title: {
    color: "#fffaf5",
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    color: "#eaded5",
    fontSize: 13,
    marginTop: 2,
  },
});
