import { factories } from '@strapi/strapi';
import { API_DAILY_MENU } from '../../../constants';
import { groupDishesByTypeWithCount, getUniqueDishesById, isMenuSafe } from '../../../utils/menu';
import { formatDish } from '../../../utils/dish';

export default factories.createCoreController('api::daily-menu.daily-menu', ({ strapi }) => ({

  async getPrices(ctx) {
    const menuId = Number(ctx.params.id);
    if (isNaN(menuId)) return ctx.badRequest('ID inválido');

    try {
      const data = await strapi.service(API_DAILY_MENU).getMenuPrices(menuId);
      ctx.body = data;
    } catch (err) {
      ctx.throw(400, err.message);
    }
  },

  async getDesserts(ctx) {
    const menus = await strapi.db.query(API_DAILY_MENU).findMany({
      populate: { dessert: true },
    });

    const desserts = menus
      .filter(menu => menu.dessert)
      .map(menu => menu.dessert);

    ctx.body = getUniqueDishesById(desserts);
  },

  async getMenusByPriceRange(ctx) {
    const min = Number(ctx.query.min_precio) || 0;
    const max = Number(ctx.query.max_precio) || Number.MAX_SAFE_INTEGER;

    const menus = await strapi.db.query(API_DAILY_MENU).findMany({
      where: { prize: { $gte: min, $lte: max } },
      populate: {
        firstCourse: { fields: ['id', 'name', 'type', 'prize'] },
        secondCourse: { fields: ['id', 'name', 'type', 'prize'] },
        dessert: { fields: ['id', 'name', 'type', 'prize'] },
      },
      select: ['id', 'day', 'prize'],
    });

    ctx.body = menus.map(menu => ({
      id: menu.id,
      day: menu.day,
      prize: menu.prize,
      firstCourse: menu.firstCourse ?? null,
      secondCourse: menu.secondCourse ?? null,
      dessert: menu.dessert ?? null,
    }));
  },

  async withoutAllergens(ctx) {
    const rawAllergens = ctx.query.excluir_alergenos;

    if (typeof rawAllergens !== 'string') {
      return ctx.badRequest('Debes especificar al menos un alérgeno a excluir como texto.');
    }

    const excludeList = rawAllergens.split(',').map(a => a.trim().toLowerCase());

    const menus = await strapi.db.query(API_DAILY_MENU).findMany({
      populate: {
        firstCourse: { populate: { allergen: true } },
        secondCourse: { populate: { allergen: true } },
        dessert: { populate: { allergen: true } },
      },
    });

    const safeMenus = menus.filter(menu => isMenuSafe(menu, excludeList));

    ctx.body = safeMenus.map(menu => ({
      id: menu.id,
      firstCourse: formatDish(menu.firstCourse),
      secondCourse: formatDish(menu.secondCourse),
      dessert: formatDish(menu.dessert),
    }));
  },

  async getPopularDishes(ctx) {
    const menus = await strapi.db.query(API_DAILY_MENU).findMany({
      populate: {
        firstCourse: true,
        secondCourse: true,
        dessert: true,
      },
    });

    const popularDishes = groupDishesByTypeWithCount(menus);

    ctx.body = popularDishes;
  },

}));
