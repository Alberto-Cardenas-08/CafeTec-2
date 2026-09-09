import { CategoryScreen } from "@/components/category-screen";

export default function LunchScreen() {
  return (
    <CategoryScreen
      category="lunch"
      title="Lunch"
      description="Deliciosas opciones para tu comida del día"
      color="#57301c"
      bannerImage={require("@/assets/images/Lunch.png")}
    />
  );
}
