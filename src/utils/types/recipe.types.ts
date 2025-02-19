
export interface RawRecipeData {
  data: any[];
  status: string;
}

export interface TiktokRawData {
  data: any[];
  status: string;
}

export interface TiktokVideo {
  title: string;
  description: string;
  embedUrl: string;
  videoId: string;
}

export interface IngredientSection {
  title: string;
  items: string[];
}

export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  category: string;
  prepTime?: string;
  source: string;
  sourceUrl: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  author?: string;
  credits?: string;
  siteCategories: string[];
}
