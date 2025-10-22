import { factories } from '@strapi/strapi';
import { PopulatedMenu, Dish } from '../../../types';
import { API_DAILY_MENU } from '../../../constants';
import { calculatePrices, populateDish } from '../../../utils';

export default factories.createCoreService('api::daily-menu.daily-menu', ({ strapi }) => ({

  async getMenuPrices(menuId: number) {
    const menu = await strapi.entityService.findOne(API_DAILY_MENU, menuId, {
      populate: ['firstCourse', 'secondCourse', 'dessert'],
    }) as PopulatedMenu;

    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found.`);
    }

    const { totalPrizeNoIVA, totalPrizeWithIVA } = calculatePrices([
      menu.firstCourse ?? null,
      menu.secondCourse ?? null,
      menu.dessert ?? null,
    ]);

    return {
      firstCourse: populateDish(menu.firstCourse),
      secondCourse: populateDish(menu.secondCourse),
      dessert: populateDish(menu.dessert),
      totalPrizeNoIVA,
      totalPrizeWithIVA,
    };
  },

}));
