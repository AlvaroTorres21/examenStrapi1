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

export interface Dish {
  id: number;
  name: string;
  prize: number;
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
