import { CategoryScreen } from "@/components/category-screen";

export default function HotDrinksScreen() {
  return (
    <CategoryScreen
      category="hot-drinks"
      title="Bebidas Calientes"
      description="Deliciosas y preparadas con los mejores granos"
      color="#57301c"
      bannerImage={require("@/assets/images/Bebida-caliente.png")}
    />
  );
}
