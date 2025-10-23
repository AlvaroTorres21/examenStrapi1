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

type DishCount = { dish: Dish; count: number };

function getDishesFromMenu(menu: Menu): (Dish | null)[] {
  return [menu.firstCourse, menu.secondCourse, menu.dessert];
}

function updateDishCountMap(
  dishCountMap: Map<number, DishCount>,
  dish: Dish
) {
  const key = dish.id;
  if (!dishCountMap.has(key)) {
    dishCountMap.set(key, { dish, count: 1 });
  } else {
    dishCountMap.get(key)!.count += 1;
  }
}

function groupDishesByType(dishCountMap: Map<number, DishCount>) {
  const grouped: Record<string, DishCount[]> = {
    first: [],
    second: [],
    dessert: [],
  };

  dishCountMap.forEach(({ dish, count }) => {
    if (grouped[dish.type]) {
      grouped[dish.type].push({ dish, count });
    }
  });

  return grouped;
}

function getTopDishesByType(
  groupedDishes: Record<string, DishCount[]>
) {
  return Object.entries(groupedDishes)
    .map(([type, dishes]) => {
      if (dishes.length === 0) return null;
      const topDish = dishes.sort((a, b) => b.count - a.count)[0];
      return {
        id: topDish.dish.id,
        name: topDish.dish.name,
        prize: topDish.dish.prize,
        type: topDish.dish.type,
        count: topDish.count,
      };
    })
    .filter(Boolean);
}

export function groupDishesByTypeWithCount(menus: Menu[]) {
  const dishCountMap = new Map<number, DishCount>();

  menus.forEach((menu) => {
    const uniqueDishIds = new Set<number>();
    getDishesFromMenu(menu).forEach((dish) => {
      if (!dish) return;
      if (!uniqueDishIds.has(dish.id)) {
        uniqueDishIds.add(dish.id);
        updateDishCountMap(dishCountMap, dish);
      }
    });
  });

  const groupedDishes = groupDishesByType(dishCountMap);

  return getTopDishesByType(groupedDishes);
}

export function populateDish(dish?: Dish | null) {
  return {
    id: dish?.id ?? null,
    name: dish?.name ?? null,
    prize: dish?.prize ?? 0,
  };
}
