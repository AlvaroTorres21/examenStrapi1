import { EventParams, Dish } from '../../../../types';
import { extractRelationId, calculatePrices } from '../../../../utils';
import { API_DAILY_MENU, API_DISH, DISH_FIELDS } from '../../../../constants';

export default {
  async beforeCreate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

  async beforeUpdate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

    async afterUpdate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

    async afterCreate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

};  

/*function extractRelationId(relation: any): number | null {
  if (!relation) return null;

  if (Array.isArray(relation.connect) && relation.connect[0]?.id)
    return relation.connect[0].id;

  if (Array.isArray(relation.set) && relation.set[0]?.id)
    return relation.set[0].id;

  if (typeof relation.id === 'number') return relation.id;

  if (typeof relation === 'number') return relation;

  return null;
}*/

async function validateDishTypes(event: any) {
  const { data } = event.params;

  const validations = [
    {
      id: extractRelationId(data.firstCourse),
      expectedType: 'first',
      field: 'firstCourse',
    },
    {
      id: extractRelationId(data.secondCourse),
      expectedType: 'second',
      field: 'secondCourse',
    },
    {
      id: extractRelationId(data.dessert),
      expectedType: 'dessert',
      field: 'dessert',
    },
  ];

  const tasks = validations.map(async ({ id, expectedType, field }) => {
    if (!id) return;

    const dish = await strapi.entityService.findOne('api::dish.dish', id, {
      fields: ['type', 'name'],
    });

    if (!dish) {
      throw new Error(`Dish with ID ${id} assigned to '${field}' not found.`);
    }

    if (dish.type !== expectedType) {
      throw new Error(
        `Dish '${dish.name}' (ID ${id}) assigned to '${field}' must be of type '${expectedType}', but is '${dish.type}'.`
      );
    }
  });

  await Promise.all(tasks);
}

export async function updateTotalPrizes(event: { params: EventParams }): Promise<void> {
  const { data, where } = event.params;
  const menuId = where?.id ?? data.id;

  const firstId = extractRelationId(data.firstCourse);
  const secondId = extractRelationId(data.secondCourse);
  const dessertId = extractRelationId(data.dessert);

  strapi.log.info('🔍 Extraídos IDs de platos:', { firstId, secondId, dessertId });

  if (menuId) {
    try {
      strapi.log.info(`🔄 Recalculando precios desde servicio para menú ${menuId}`);

      const prices = await strapi.service(API_DAILY_MENU).getMenuPrices(menuId);

      if (prices) {
        data.totalPrizeNoIVA = prices.totalPrizeNoIVA;
        data.totalPrizeWithIVA = prices.totalPrizeWithIVA;

        strapi.log.info('✅ Precios actualizados desde servicio:', {
          totalPrizeNoIVA: prices.totalPrizeNoIVA,
          totalPrizeWithIVA: prices.totalPrizeWithIVA,
        });

        return;
      }
    } catch (error) {
      strapi.log.error('❌ Error al obtener precios desde el servicio:', error);
    }
  }

  try {
    strapi.log.info('➕ Calculando precios manualmente (sin ID de menú)');

    const dishIds = [firstId, secondId, dessertId].filter((id): id is number => typeof id === 'number');

    const dishes = await Promise.all(
      dishIds.map(id =>
        strapi.entityService.findOne(API_DISH, id, { fields: DISH_FIELDS }) as Promise<Dish | null>
      )
    );

    const { totalPrizeNoIVA, totalPrizeWithIVA } = calculatePrices(dishes);

    data.totalPrizeNoIVA = totalPrizeNoIVA;
    data.totalPrizeWithIVA = totalPrizeWithIVA;

    strapi.log.info('✅ Precios calculados manualmente:', { totalPrizeNoIVA, totalPrizeWithIVA });
  } catch (error) {
    strapi.log.error('❌ Error calculando precios manualmente:', error);
  }
}