export default {
  routes: [
    {
      method: "GET",
      path: "/daily-menus/:id/prices",
      handler: "daily-menu.getPrices",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/daily-menus/desserts",
      handler: "daily-menu.getDesserts",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/daily-menus/by-price",
      handler: "daily-menu.getMenusByPriceRange",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/daily-menus/without-allergens",
      handler: "daily-menu.withoutAllergens",
      config: {
        auth: false,
      },
    },
    {
  method: 'GET',
  path: '/daily-menus/populars',
  handler: 'daily-menu.getPopularDishes',
  config: {
    policies: [],
      },
    }
  ],
};