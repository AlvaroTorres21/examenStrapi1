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

// Función reutilizable para extraer ID de una relación
function extractRelationId(relation: any): number | null {
  if (!relation) return null;

  if (Array.isArray(relation.connect) && relation.connect[0]?.id)
    return relation.connect[0].id;

  if (Array.isArray(relation.set) && relation.set[0]?.id)
    return relation.set[0].id;

  if (typeof relation.id === 'number') return relation.id;

  if (typeof relation === 'number') return relation;

  return null;
}

// Validar que los platos asignados coincidan con su tipo esperado
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

async function updateTotalPrizes(event: any) {
  const { data, where } = event.params;

  const menuId = where?.id || data.id;

  // Siempre extraemos los IDs de los platos
  const firstId = extractRelationId(data.firstCourse);
  const secondId = extractRelationId(data.secondCourse);
  const dessertId = extractRelationId(data.dessert);

  strapi.log.info(`🔍 Extraídos IDs de platos:`, { firstId, secondId, dessertId });

  // Si tenemos un ID del menú, usamos el servicio
  if (menuId) {
    strapi.log.info(`🔄 Recalculando precios desde el servicio para menú ${menuId}`);
    try {
      const prices = await strapi
        .service('api::daily-menu.daily-menu')
        .getMenuPrices(menuId);

      data.totalPrizeNoIVA = prices.totalPrizeNoIVA;
      data.totalPrizeWithIVA = prices.totalPrizeWithIVA;

      strapi.log.info('✅ Precios actualizados desde servicio:', {
        totalPrizeNoIVA: prices.totalPrizeNoIVA,
        totalPrizeWithIVA: prices.totalPrizeWithIVA,
      });

      return;
    } catch (err) {
      strapi.log.error('❌ Error al obtener precios desde el servicio:', err);
    }
  }

  // Si no hay ID, lo calculamos manualmente (caso típico en beforeCreate)
  strapi.log.info('➕ Calculando precios manualmente (sin ID de menú)');
  try {
    const [first, second, dessert] = await Promise.all([
      firstId ? strapi.entityService.findOne('api::dish.dish', firstId, { fields: ['prize'] }) : null,
      secondId ? strapi.entityService.findOne('api::dish.dish', secondId, { fields: ['prize'] }) : null,
      dessertId ? strapi.entityService.findOne('api::dish.dish', dessertId, { fields: ['prize'] }) : null,
    ]);

    const firstPrize = first?.prize || 0;
    const secondPrize = second?.prize || 0;
    const dessertPrize = dessert?.prize || 0;

    const totalPrizeNoIVA = firstPrize + secondPrize + dessertPrize;
    const totalPrizeWithIVA = parseFloat((totalPrizeNoIVA * 1.21).toFixed(2));

    data.totalPrizeNoIVA = totalPrizeNoIVA;
    data.totalPrizeWithIVA = totalPrizeWithIVA;

    strapi.log.info('✅ Precios calculados manualmente:', {
      totalPrizeNoIVA,
      totalPrizeWithIVA,
    });
  } catch (err) {
    strapi.log.error('❌ Error calculando precios manualmente:', err);
  }
}