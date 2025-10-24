import { Dish, MenuData, DishFields } from '../../../../types';
import { calculatePrices } from '../../../../utils';
import { API_DAILY_MENU, DISH_FIELDS_TYPES } from '../../../../constants';


async function getMenusContainingDish(dishId: number): Promise<MenuData[]> {
  const filters = DISH_FIELDS_TYPES.map(field => ({ [field]: dishId }));

  return strapi.entityService.findMany(API_DAILY_MENU, {
    filters: { $or: filters },
    populate: {
      firstCourse: { fields: ['id', 'name', 'prize'] },
      secondCourse: { fields: ['id', 'name', 'prize'] },
      dessert: { fields: ['id', 'name', 'prize'] },
    },
  }) as Promise<MenuData[]>;
}

async function recalculateAndUpdateMenu(menu: MenuData) {
  const dishes = DISH_FIELDS_TYPES.map(field => menu[field]).filter(Boolean) as Dish[];
  const { totalPrizeNoIVA, totalPrizeWithIVA } = calculatePrices(dishes);

  await strapi.entityService.update(API_DAILY_MENU, menu.id, {
    data: { totalPrizeNoIVA, totalPrizeWithIVA },
  });

  strapi.log.info(`🟢 Precios recalculados para menú ID ${menu.id}`);
}

export default {
  async beforeUpdate(event: { params: { where?: { id?: number } }; state: { oldPrize?: number } }) {
    const dishId = event.params.where?.id;
    if (!dishId) return;

    const oldDish = await strapi.entityService.findOne('api::dish.dish', dishId, { fields: ['prize'] });
    if (!oldDish) return;

    event.state.oldPrize = oldDish.prize;
  },

  async afterUpdate(event: { result: Dish; state: { oldPrize?: number } }) {
    const { result, state } = event;
    const dishId = result.id;

    if (state.oldPrize === result.prize) {
      strapi.log.info('⚪ Precio no cambiado, no se actualizan menús.');
      return;
    }

    strapi.log.info(`🔔 afterUpdate lifecycle: precio cambiado para plato ID ${dishId}`);

    const menusContainingDish = await getMenusContainingDish(dishId);

    await Promise.all(menusContainingDish.map(menu => recalculateAndUpdateMenu(menu)));
  },
};
