// src/api/daily-menu/services/menu-service.ts

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::daily-menu.daily-menu', ({ strapi }) => ({
  async getMenuPrices(menuId: number) {
    // Obtener el menú por ID con relaciones incluidas
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

    // Extraer precios de los platos
    const firstPrice = menu.firstCourse?.prize || 0;
    const secondPrice = menu.secondCourse?.prize || 0;
    const dessertPrice = menu.dessert?.prize || 0;

    // Total sin IVA
    const totalNoIVA = firstPrice + secondPrice + dessertPrice;

    // IVA (21% por ejemplo)
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
