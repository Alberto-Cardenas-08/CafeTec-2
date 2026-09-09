import { CategoryScreen } from "@/components/category-screen";

export default function FrappesScreen() {
  return (
    <CategoryScreen
      category="frappes"
      title="Frappes"
      description="Refrescantes batidos con hielo y mucho sabor"
      color="#dfb887"
      bannerImage={require("@/assets/images/Frappes.png")}
    />
  );
}
