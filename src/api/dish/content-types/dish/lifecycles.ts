import { MenuData } from '../../../../types';
import { calculatePrices } from '../../../../utils';

export default {
  async beforeUpdate(event) {
    const { params } = event;
    const dishId = params.where?.id;
    if (!dishId) return;

    const oldDish = await strapi.entityService.findOne('api::dish.dish', dishId);
    if (!oldDish) return;

    event.state.oldPrize = oldDish.prize;
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const dishId = result?.id;
    if (!dishId) return;

    const oldPrize = state.oldPrize;
    const newPrize = result.prize;

    strapi.log.info('🔔 afterUpdate lifecycle triggered');
    strapi.log.info(`Precio anterior: ${oldPrize}, nuevo precio: ${newPrize}`);

    if (oldPrize === newPrize) {
      strapi.log.info('⚪ Precio no cambiado, no se actualizan menús.');
      return;
    }

    const menusContainingDish = await strapi.entityService.findMany('api::daily-menu.daily-menu', {
      filters: {
        $or: [
          { firstCourse: dishId },
          { secondCourse: dishId },
          { dessert: dishId },
        ],
      },
      populate: {
        firstCourse: {
          fields: ['id', 'name', 'prize'],
        },
        secondCourse: {
          fields: ['id', 'name', 'prize'],
        },
        dessert: {
          fields: ['id', 'name', 'prize'],
        },
      },
    }) as MenuData[];

    for (const menu of menusContainingDish) {
      const dishes = [menu.firstCourse, menu.secondCourse, menu.dessert].filter(Boolean);

      const { totalPrizeNoIVA, totalPrizeWithIVA } = calculatePrices(dishes);

      await strapi.entityService.update('api::daily-menu.daily-menu', menu.id, {
        data: {
          totalPrizeNoIVA,
          totalPrizeWithIVA,
        },
      });

      strapi.log.info(`🟢 Precios recalculados para menú ID ${menu.id} tras cambio de precio del plato ID ${dishId}`);
    }
  },
};
