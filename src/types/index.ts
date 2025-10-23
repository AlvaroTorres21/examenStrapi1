export interface RelationField {
  id?: number;
}

export interface MenuData {
  id?: number;
  firstCourse?: RelationField;
  secondCourse?: RelationField;
  dessert?: RelationField;
  totalPrizeNoIVA?: number;
  totalPrizeWithIVA?: number;
}

export interface EventParams {
  data: MenuData;
  where?: {
    id?: number;
  };
}


export interface PopulatedDish {
  id: number | null;
  name: string | null;
  prize: number;
}
export interface PopulatedMenu {
  firstCourse?: PopulatedDish;
  secondCourse?: PopulatedDish;
  dessert?: PopulatedDish;
}

export interface Allergen {
  id: number;
  name: string;
}

export interface Dish {
  id: number;
  name: string;
  type?: 'first' | 'second' | 'dessert';
  prize: number;
  allergen?: Allergen[];
}


export interface Menu {
  id: number;
  prize?: number;
  day?: string;
  firstCourse?: Dish;
  secondCourse?: Dish;
  dessert?: Dish;
}

export interface Event {
  params: EventParams;
}