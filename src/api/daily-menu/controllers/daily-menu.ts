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

  async withoutAllergens(ctx) {
  const rawAllergens = ctx.query.excluir_alergenos;

  if (typeof rawAllergens !== 'string') {
    return ctx.badRequest(
      'Debes especificar al menos un alérgeno a excluir como una cadena separada por comas.'
    );
  }

  const excludeList = rawAllergens
    .split(',')
    .map(a => a.trim().toLowerCase());

  const menus = await strapi.db.query('api::daily-menu.daily-menu').findMany({
    populate: {
      firstCourse: { populate: { allergen: true } },
      secondCourse: { populate: { allergen: true } },
      dessert: { populate: { allergen: true } },
    },
  });

  const safeMenus = menus
    .filter(menu => {
      const dishes = [menu.firstCourse, menu.secondCourse, menu.dessert].filter(Boolean);

      return dishes.every(dish => {
        const allergens = Array.isArray(dish.allergen)
          ? dish.allergen.map(a => (a?.name || '').toLowerCase())
          : [];

        return !allergens.some(allergen => excludeList.includes(allergen));
      });
    });
  safeMenus.forEach(menu => {
    console.log(`\n🍽️ Menu ID: ${menu.id}`);

    ['firstCourse', 'secondCourse', 'dessert'].forEach(courseKey => {
      const dish = menu[courseKey];
      if (!dish) {
        console.log(`  ⚠️ ${courseKey}: sin plato`);
        return;
      }

      const allergens = Array.isArray(dish.allergen)
        ? dish.allergen.map(a => a?.name?.toLowerCase()).filter(Boolean)
        : [];

      console.log(`  ✅ ${courseKey} - ${dish.name} (ID: ${dish.id})`);
      console.log(`    🧬 Alérgenos: [${allergens.join(', ')}]`);
    });
  });
  ctx.body = safeMenus.map(menu => ({
    id: menu.id,
    firstCourse: formatDish(menu.firstCourse),
    secondCourse: formatDish(menu.secondCourse),
    dessert: formatDish(menu.dessert),
  }));
},

async getPopularDishes(ctx) {
  const menus = await strapi.db.query('api::daily-menu.daily-menu').findMany({
    populate: {
      firstCourse: true,
      secondCourse: true,
      dessert: true,
    },
  });

  const dishCountMap = new Map();

  menus.forEach(menu => {
    const dishes = [menu.firstCourse, menu.secondCourse, menu.dessert];
    dishes.forEach(dish => {
      if (!dish) return;
      const key = `${dish.name}|${dish.type}|${dish.prize}`;
      if (!dishCountMap.has(key)) {
        dishCountMap.set(key, { dish, count: 1 });
      } else {
        dishCountMap.get(key).count += 1;
      }
    });
  });

  const sortedDishes = Array.from(dishCountMap.values())
    .sort((a, b) => b.count - a.count)
    .map(item => ({
      id: item.dish.id,
      name: item.dish.name,
      prize: item.dish.prize,
      type: item.dish.type,
      count: item.count,
    }));

  ctx.body = sortedDishes;
}

}));
// Función para formatear un plato con sus alérgenos
function formatDish(dish) {
  if (!dish) return null;

  const allergens = Array.isArray(dish.allergen)
    ? dish.allergen.map(a => a?.name?.toLowerCase()).filter(Boolean)
    : [];

  return {
    id: dish.id,
    name: dish.name,
    allergens,
  };
};
