import type { Schema, Struct } from '@strapi/strapi';

export interface FoodSpecialAllergen extends Struct.ComponentSchema {
  collectionName: 'components_food_special_allergens';
  info: {
    displayName: 'allergen';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'food-special.allergen': FoodSpecialAllergen;
    }
  }
}
