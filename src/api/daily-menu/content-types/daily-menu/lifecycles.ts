import { EventParams, Dish, Event } from '../../../../types';
import { extractRelationId, calculatePrices } from '../../../../utils';
import { API_DAILY_MENU, API_DISH, DISH_FIELDS } from '../../../../constants';
import { errors } from '@strapi/utils';
const { ValidationError } = errors;



export default {
  async beforeCreate(event: Event) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

  async beforeUpdate(event: Event) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

    async afterUpdate(event: Event) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

    async afterCreate(event: Event) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

};  


async function validateDishTypes(event: Event) {
  const { data } = event.params;

  strapi.log.info('🟡 Validating dish types with raw data:', JSON.stringify(data));

  const validations = [
    { id: extractRelationId(data.firstCourse), expectedType: 'first', field: 'firstCourse', rawValue: data.firstCourse },
    { id: extractRelationId(data.secondCourse), expectedType: 'second', field: 'secondCourse', rawValue: data.secondCourse },
    { id: extractRelationId(data.dessert), expectedType: 'dessert', field: 'dessert', rawValue: data.dessert },
  ];

  for (const { id, expectedType, field } of validations) {
    if (!id) {
      strapi.log.info(`⚪ No dish ID provided for ${field}, skipping validation.`);
      continue;
    }

    const dish = await strapi.entityService.findOne('api::dish.dish', id, {
      fields: ['type', 'name'],
    });

    if (!dish) {
      throw new ValidationError(`El plato con ID ${id} para '${field}' no existe.`);
    }

    if (dish.type !== expectedType) {
      throw new ValidationError(
      `El plato '${dish.name}' (ID ${id}) para '${field}' debe ser tipo '${expectedType}', pero es '${dish.type}'.`
    );
    }

    strapi.log.info(`✅ Dish '${dish.name}' passed validation for field '${field}'.`);
  }
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