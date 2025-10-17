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
      firstCourse: {
        fields: ['id', 'name', 'type', 'prize'],
      },
      secondCourse: {
        fields: ['id', 'name', 'type', 'prize'],
      },
      dessert: {
        fields: ['id', 'name', 'type', 'prize'],
      },
    },
    select: ['id', 'day', 'prize'],
  });

  const result = menus.map(menu => ({
    id: menu.id,
    day: menu.day,
    prize: menu.prize,
    firstCourse: menu.firstCourse
      ? {
          id: menu.firstCourse.id,
          name: menu.firstCourse.name,
          type: menu.firstCourse.type,
          prize: menu.firstCourse.prize,
        }
      : null,
    secondCourse: menu.secondCourse
      ? {
          id: menu.secondCourse.id,
          name: menu.secondCourse.name,
          type: menu.secondCourse.type,
          prize: menu.secondCourse.prize,
        }
      : null,
    dessert: menu.dessert
      ? {
          id: menu.dessert.id,
          name: menu.dessert.name,
          type: menu.dessert.type,
          prize: menu.dessert.prize,
        }
      : null,
  }));

  ctx.body = result;
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

  const groupedByType = {
    first: [],
    second: [],
    dessert: [],
  };

  dishCountMap.forEach(({ dish, count }) => {
    if (groupedByType[dish.type]) {
      groupedByType[dish.type].push({ dish, count });
    }
  });

  const mostPopular = Object.entries(groupedByType).map(([type, dishes]) => {
    if (dishes.length === 0) return null;

    const topDish = dishes.sort((a, b) => b.count - a.count)[0];

    return {
      id: topDish.dish.id,
      name: topDish.dish.name,
      prize: topDish.dish.prize,
      type: topDish.dish.type,
      count: topDish.count,
    };
  }).filter(Boolean);

  ctx.body = mostPopular;
}


}));

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
