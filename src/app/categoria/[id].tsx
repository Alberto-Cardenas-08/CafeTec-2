import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

import { CategoryScreen } from "@/components/category-screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FALLBACK_CATEGORIES, getCategory, type MenuCategory } from "@/services/categories";

export default function DynamicCategoryScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const categoryId = Array.isArray(id) ? id[0] : id;
  const fallback = FALLBACK_CATEGORIES.find((item) => item.id === categoryId);
  const [category, setCategory] = useState<MenuCategory | null>(fallback ?? null);

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    getCategory(categoryId).then((item) => {
      if (active && item) setCategory(item);
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [categoryId]);

  if (!categoryId) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Falta la categoría.</ThemedText>
      </ThemedView>
    );
  }

  if (!category) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color="#57301c" />
      </ThemedView>
    );
  }

  return (
    <CategoryScreen
      category={category.id}
      title={category.name}
      description={category.description}
      color={category.color}
      bannerImage={category.image}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#fbf6ef", alignItems: "center", justifyContent: "center" },
});
