import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_KEY = "cafetec-device-id";

function createId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

let cachedId: string | null = null;

export async function getDeviceId() {
  if (cachedId) return cachedId;
  const stored = await AsyncStorage.getItem(DEVICE_KEY);
  if (stored) {
    cachedId = stored;
    return stored;
  }
  const id = createId();
  await AsyncStorage.setItem(DEVICE_KEY, id);
  cachedId = id;
  return id;
}
