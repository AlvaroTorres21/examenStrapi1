import { Dish, PopulatedDish, Relation} from '../types';
import { IVA_FACTOR} from '../constants';

export function extractRelationId(relation?: Relation): number | undefined {
  if (!relation) return undefined;

  if (typeof relation === 'number') return relation;

  if ('id' in relation && typeof relation.id === 'number') return relation.id;

  if ('connect' in relation && Array.isArray(relation.connect) && relation.connect.length > 0) {
    const id = relation.connect[0]?.id;
    if (typeof id === 'number') return id;
  }

  if ('set' in relation && Array.isArray(relation.set) && relation.set.length > 0) {
    const id = relation.set[0]?.id;
    if (typeof id === 'number') return id;
  }

  return undefined;
}

export function calculatePrices(dishes: (Dish | null)[]): { totalPrizeNoIVA: number; totalPrizeWithIVA: number } {
  const totalPrizeNoIVA = dishes.reduce((sum, dish) => sum + (dish?.prize ?? 0), 0);
  const totalPrizeWithIVA = parseFloat((totalPrizeNoIVA * IVA_FACTOR).toFixed(2));
  return { totalPrizeNoIVA, totalPrizeWithIVA };
}

export function populateDish(dish?: Dish | null): PopulatedDish {
  return {
    id: dish?.id ?? null,
    name: dish?.name ?? null,
    prize: dish?.prize ?? 0,
  };
}
