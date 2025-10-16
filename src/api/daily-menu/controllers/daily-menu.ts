// src/api/daily-menu/controllers/daily-menu.ts

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::daily-menu.daily-menu', ({ strapi }) => ({
  async getPrices(ctx) {
    const menuId = ctx.params.id;

    try {
      const data = await strapi
        .service('api::daily-menu.daily-menu')
        .getMenuPrices(Number(menuId));

      ctx.body = data;
    } catch (err) {
      ctx.throw(400, err.message);
    }
  },

   async getDesserts(ctx) {
    const menus = await strapi.db.query('api::daily-menu.daily-menu').findMany({
      populate: {
        dessert: true,
      },
    });

    const menusConPostre = menus.filter(menu => menu.dessert);

    const postres = menusConPostre
      .map(menu => menu.dessert)
      .filter((postre, index, self) =>
        index === self.findIndex(p => p.id === postre.id)
      );

    ctx.body = postres;
  },

     async getMenusByPriceRange(ctx) {
    const min = Number(ctx.query.min_precio) || 0;
    const max = Number(ctx.query.max_precio) || Number.MAX_SAFE_INTEGER;

    const menus = await strapi.db.query('api::daily-menu.daily-menu').findMany({
      where: {
        prize: {
          $gte: min,
          $lte: max,
        },
      },
      populate: {
        firstCourse: true,
        secondCourse: true,
        dessert: true,
      },
    });

    ctx.body = menus;
  },

}));
