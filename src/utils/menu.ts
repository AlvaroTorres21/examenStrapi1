import { Dish, Menu } from '../types';

export function getUniqueDishesById(dishes: Dish[]): Dish[] {
  const seen = new Set();
  return dishes.filter(dish => {
    if (seen.has(dish.id)) return false;
    seen.add(dish.id);
    return true;
  });
}

export function isMenuSafe(menu: Menu, excludeList: string[]): boolean {
  const dishes = [menu.firstCourse, menu.secondCourse, menu.dessert].filter(Boolean);

  return dishes.every(dish => {
    const allergens = Array.isArray(dish.allergen)
      ? dish.allergen.map(a => (a?.name || '').toLowerCase())
      : [];
    return !allergens.some(allergen => excludeList.includes(allergen));
  });
}

export function groupDishesByTypeWithCount(menus: Menu[]) {
  const dishCountMap = new Map<string, { dish: Dish; count: number }>();

  menus.forEach(menu => {
    const dishes = [menu.firstCourse, menu.secondCourse, menu.dessert];
    dishes.forEach(dish => {
      if (!dish) return;
      const key = `${dish.name}|${dish.type}|${dish.prize}`;
      if (!dishCountMap.has(key)) {
        dishCountMap.set(key, { dish, count: 1 });
      } else {
        dishCountMap.get(key)!.count += 1;
      }
    });
  });

  const groupedByType: Record<string, { dish: Dish; count: number }[]> = {
    first: [],
    second: [],
    dessert: [],
  };

  dishCountMap.forEach(({ dish, count }) => {
    if (groupedByType[dish.type]) {
      groupedByType[dish.type].push({ dish, count });
    }
  });

  return Object.entries(groupedByType).map(([type, dishes]) => {
    if (dishes.length === 0) return null;
    const topDish = dishes.sort((a, b) => b.count - a.count)[0];
    return {
      id: topDish.dish.id,
      name: topDish.dish.name,
      prize: topDish.dish.prize,
      type: topDish.dish.type,
      count: topDish.count,
    };
  }).filter(Boolean);
}

export function populateDish(dish?: Dish | null) {
  return {
    id: dish?.id ?? null,
    name: dish?.name ?? null,
    prize: dish?.prize ?? 0,
  };
}
