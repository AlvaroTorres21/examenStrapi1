import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::daily-menu.daily-menu', ({ strapi }) => ({
  async getMenuPrices(menuId: number) {
    const menu = await strapi.entityService.findOne('api::daily-menu.daily-menu', menuId, {
  populate: ['firstCourse', 'secondCourse', 'dessert'],
    }) as {
  firstCourse?: { id: number; name: string; prize: number };
  secondCourse?: { id: number; name: string; prize: number };
  dessert?: { id: number; name: string; prize: number };
    };


    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found.`);
    }

    const firstPrice = menu.firstCourse?.prize || 0;
    const secondPrice = menu.secondCourse?.prize || 0;
    const dessertPrice = menu.dessert?.prize || 0;

    const totalNoIVA = firstPrice + secondPrice + dessertPrice;

    const ivaRate = 0.21;
    const totalWithIVA = totalNoIVA * (1 + ivaRate);

    return {
      firstCourse: {
        id: menu.firstCourse?.id || null,
        name: menu.firstCourse?.name || null,
        prize: firstPrice,
      },
      secondCourse: {
        id: menu.secondCourse?.id || null,
        name: menu.secondCourse?.name || null,
        prize: secondPrice,
      },
      dessert: {
        id: menu.dessert?.id || null,
        name: menu.dessert?.name || null,
        prize: dessertPrice,
      },
      totalPrizeNoIVA: totalNoIVA,
      totalPrizeWithIVA: parseFloat(totalWithIVA.toFixed(2)),
    };
  },
}));
