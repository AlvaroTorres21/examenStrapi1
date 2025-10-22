import { factories } from '@strapi/strapi';
import {PopulatedMenu, PopulatedDish, Dish} from '../../../types';
import { API_DAILY_MENU } from '../../../constants';
import { calculatePrices, extractRelationId } from '../../../utils';

export default factories.createCoreService('api::daily-menu.daily-menu', ({ strapi }) => ({

  async getMenuPrices(menuId: number) {
    const menu = await strapi.entityService.findOne(API_DAILY_MENU, menuId, {
      populate: ['firstCourse', 'secondCourse', 'dessert'],
    }) as PopulatedMenu;

    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found.`);
    }

    const first = menu.firstCourse;
    const second = menu.secondCourse;
    const dessert = menu.dessert;

    const firstPrice = first?.prize || 0;
    const secondPrice = second?.prize || 0;
    const dessertPrice = dessert?.prize || 0;

    const { totalPrizeNoIVA, totalPrizeWithIVA } = calculatePrices([
      menu.firstCourse ?? null,
      menu.secondCourse ?? null,
      menu.dessert ?? null,
    ]);

    return {
      firstCourse: {
        id: first?.id ?? null,
        name: first?.name ?? null,
        prize: firstPrice,
      },
      secondCourse: {
        id: second?.id ?? null,
        name: second?.name ?? null,
        prize: secondPrice,
      },
      dessert: {
        id: dessert?.id ?? null,
        name: dessert?.name ?? null,
        prize: dessertPrice,
      },
      totalPrizeNoIVA,
      totalPrizeWithIVA,
    };
  },
}));
