export default {
  async beforeCreate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },

  async beforeUpdate(event: any) {
    await validateDishTypes(event);
    await updateTotalPrizes(event);
  },
};

async function validateDishTypes(event: any) {
  const { data } = event.params;

  const getId = (relation: any) => {
    if (!relation) return null;
    if (Array.isArray(relation.connect) && relation.connect[0]?.id)
      return relation.connect[0].id;
    if (Array.isArray(relation.set) && relation.set[0]?.id)
      return relation.set[0].id;
    if (typeof relation.id === 'number') return relation.id;
    if (typeof relation === 'number') return relation;
    return null;
  };

  const firstId = getId(data.firstCourse);
  const secondId = getId(data.secondCourse);
  const dessertId = getId(data.dessert);

  async function checkDishType(dishId: number | null, expectedType: string, fieldName: string) {
    if (!dishId) return;
    const dish = await strapi.entityService.findOne('api::dish.dish', dishId, {
      fields: ['type', 'name'],
    });
    if (!dish) {
      throw new Error(`Dish with ID ${dishId} assigned to '${fieldName}' not found.`);
    }
    if (dish.type !== expectedType) {
      throw new Error(`Dish '${dish.name}' (ID ${dishId}) assigned to '${fieldName}' must be of type '${expectedType}', but is '${dish.type}'.`);
    }
  }

  await Promise.all([
    checkDishType(firstId, 'first', 'firstCourse'),
    checkDishType(secondId, 'second', 'secondCourse'),
    checkDishType(dessertId, 'dessert', 'dessert'),
  ]);
}

async function updateTotalPrizes(event: any) {
  const { data, where } = event.params;

  console.log('📦 Data received in lifecycle:', data);
  console.log('🔍 Where condition (menuId) received:', where);

  const menuId = where?.id;

  // Función utilitaria para extraer el ID de la relación
 const getId = (relation: any) => {
  if (!relation) return null;

  // Soporta: { connect: [{ id: 1 }] }
  if (Array.isArray(relation.connect) && relation.connect[0]?.id)
    return relation.connect[0].id;

  // Soporta: { set: [{ id: 1 }] }
  if (Array.isArray(relation.set) && relation.set[0]?.id)
    return relation.set[0].id;

  // Soporta: { id: 1 }
  if (typeof relation.id === 'number') return relation.id;

  // Soporta: número directo
  if (typeof relation === 'number') return relation;

  return null;
 };


  const firstId = getId(data.firstCourse);
  const secondId = getId(data.secondCourse);
  const dessertId = getId(data.dessert);

  console.log('✅ Extracted dish IDs:', { firstId, secondId, dessertId });

  // Si es UPDATE (tenemos menuId), usamos el servicio
  if (menuId) {
    console.log(`🔄 Fetching prices from service for menuId: ${menuId}`);
    try {
      const prices = await strapi
        .service('api::daily-menu.daily-menu')
        .getMenuPrices(menuId);

      console.log('📊 Prices returned from service:', prices);

      data.totalPrizeNoIVA = prices.totalPrizeNoIVA;
      data.totalPrizeWithIVA = prices.totalPrizeWithIVA;
      return;
    } catch (err) {
      console.error('❌ Error fetching prices from service:', err);
    }
  }

  // Si es CREATE o no tenemos menuId, calculamos manualmente
  console.log('➕ Calculating prices manually (beforeCreate or fallback)');
  try {
    const [first, second, dessert] = await Promise.all([
      firstId
        ? strapi.entityService.findOne('api::dish.dish', firstId, {
            fields: ['prize'],
          })
        : null,
      secondId
        ? strapi.entityService.findOne('api::dish.dish', secondId, {
            fields: ['prize'],
          })
        : null,
      dessertId
        ? strapi.entityService.findOne('api::dish.dish', dessertId, {
            fields: ['prize'],
          })
        : null,
    ]);

    console.log('🍽️ Dishes fetched:', {
      first,
      second,
      dessert,
    });

    const firstPrize = first?.prize || 0;
    const secondPrize = second?.prize || 0;
    const dessertPrize = dessert?.prize || 0;

    console.log('💰 Individual prizes:', {
      firstPrize,
      secondPrize,
      dessertPrize,
    });

    const totalNoIVA = firstPrize + secondPrize + dessertPrize;
    const totalWithIVA = parseFloat((totalNoIVA * 1.21).toFixed(2));

    console.log('🧮 Calculated totals:', {
      totalPrizeNoIVA: totalNoIVA,
      totalPrizeWithIVA: totalWithIVA,
    });

    data.totalPrizeNoIVA = totalNoIVA;
    data.totalPrizeWithIVA = totalWithIVA;
  } catch (err) {
    console.error('❌ Error during manual price calculation:', err);
  }
}
