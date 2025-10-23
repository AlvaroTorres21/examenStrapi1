type Allergen = {
  name?: string | null;
};

type DishInput = {
  id: number;
  name: string;
  allergen?: Allergen[] | null;
};

export function formatDish(dish: DishInput | null | undefined) {
  if (!dish) return null;

  const allergens = Array.isArray(dish.allergen)
    ? dish.allergen.map(a => a?.name?.toLowerCase()).filter(Boolean)
    : [];

  return {
    id: dish.id,
    name: dish.name,
    allergens,
  };
}
