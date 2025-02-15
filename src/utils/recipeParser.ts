
interface RawRecipeData {
  data: any[];
  status: string;
}

export const parseRecipeData = (rawData: RawRecipeData) => {
  try {
    const htmlContent = rawData.data[0]?.html || '';
    
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract title
    const title = doc.querySelector('h1')?.textContent?.trim() || 
                 doc.querySelector('.recipe-title')?.textContent?.trim() ||
                 'מתכון חדש';

    // Extract ingredients
    const ingredients: string[] = [];
    doc.querySelectorAll('.ingredient, .ingredients li, [itemprop="recipeIngredient"]').forEach(el => {
      const text = el.textContent?.trim();
      if (text) ingredients.push(text);
    });

    // Extract instructions
    const instructions: string[] = [];
    doc.querySelectorAll('.instruction, .instructions li, [itemprop="recipeInstructions"]').forEach(el => {
      const text = el.textContent?.trim();
      if (text) instructions.push(text);
    });

    // Extract image
    const image = doc.querySelector('img[itemprop="image"]')?.getAttribute('src') ||
                 doc.querySelector('.recipe-image img')?.getAttribute('src') ||
                 doc.querySelector('article img')?.getAttribute('src') ||
                 '/placeholder.svg';

    // Extract category
    const category = doc.querySelector('[itemprop="recipeCategory"]')?.textContent?.trim() ||
                    doc.querySelector('.recipe-category')?.textContent?.trim() ||
                    'כללי';

    // Extract prep time
    const prepTime = doc.querySelector('[itemprop="totalTime"]')?.textContent?.trim() ||
                    doc.querySelector('.prep-time')?.textContent?.trim();

    return {
      title,
      ingredients,
      instructions,
      image,
      category,
      prepTime,
    };
  } catch (error) {
    console.error('Error parsing recipe:', error);
    return {
      title: 'מתכון חדש',
      ingredients: [],
      instructions: [],
      image: '/placeholder.svg',
      category: 'כללי',
    };
  }
};
