import { CategoryScreen } from "@/components/category-screen";

export default function ColdDrinksScreen() {
  return (
    <CategoryScreen
      category="cold-drinks"
      title="Bebidas Frías"
      description="Refrescantes y preparadas al momento"
      color="#d07f30"
      bannerImage={require("@/assets/images/Bebidas-frias.png")}
    />
  );
}
