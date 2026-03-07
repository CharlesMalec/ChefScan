export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  prepTime: string;
  cookTime: string;
  complexity: string;
  source: 'Livre' | 'Web';
  sourceUrl?: string;
}
