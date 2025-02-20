
export interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  source: string;
  sourceUrl: string;
  prepTime?: string;
  ingredients: string[];
  instructions: string[];
  youtubeUrl?: string;
  author?: string;
  credits?: string;
  siteCategories: string[];
}
