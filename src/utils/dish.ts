export function formatDish(dish: any) {
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
