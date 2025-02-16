
interface RawRecipeData {
  data: any[];
  status: string;
}

const CATEGORIES_MAP: { [key: string]: string[] } = {
  'עוגות': ['עוגה', 'עוגות', 'עוגת', 'טורט'],
  'עוגיות': ['עוגיות', 'עוגיה', 'ביסקוטי'],
  'לחמים': ['לחם', 'חלה', 'בייגל', 'פיתה'],
  'קינוחים': ['קינוח', 'מוס', 'פודינג', 'קרם'],
  'מתוקים': ['שוקולד', 'ממתק', 'פרלין', 'טראפל'],
  'מאפים': ['מאפה', 'בורקס', 'פשטידה', 'קיש'],
  'ארוחות': ['ארוחה', 'תבשיל', 'מרק', 'פסטה', 'אורז'],
  'סלטים': ['סלט', 'ירקות'],
};

const determineCategory = (title: string, content: string): string => {
  const normalizedText = (title + ' ' + content).toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES_MAP)) {
    if (keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  
  return 'כללי';
};

const extractInstructions = (doc: Document): string[] => {
  const instructions: string[] = [];
  
  // חיפוש על פי כל הסלקטורים האפשריים
  const possibleSelectors = [
    '.preparation li',
    '.instructions li',
    '[itemprop="recipeInstructions"] li',
    '.recipe-instructions li',
    '.method li',
    '.steps li',
    'ol li',  // אם אין סלקטור ספציפי, ננסה למצוא רשימה ממוספרת
    '.preparation p',
    '.instructions p',
    '[itemprop="recipeInstructions"] p',
    '.recipe-instructions p',
    '.method p',
    '.steps p'
  ];

  // עבור על כל הסלקטורים עד שנמצא תוצאות
  for (const selector of possibleSelectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 5) { // נוודא שזה לא טקסט ריק או קצר מדי
          instructions.push(text);
        }
      });
      if (instructions.length > 0) break;
    }
  }

  // אם לא מצאנו הוראות הכנה, ננסה למצוא טקסט שמתחיל במספרים
  if (instructions.length === 0) {
    const allParagraphs = doc.querySelectorAll('p');
    allParagraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && /^\d+\.?\s/.test(text)) {
        instructions.push(text);
      }
    });
  }

  return instructions;
};

export const parseRecipeData = (rawData: RawRecipeData, sourceUrl: string) => {
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
    doc.querySelectorAll('.ingredient, .ingredients li, [itemprop="recipeIngredient"], .recipe-ingredients li').forEach(el => {
      const text = el.textContent?.trim();
      if (text) ingredients.push(text);
    });

    // Extract instructions using the new function
    const instructions = extractInstructions(doc);

    // Extract image
    const image = doc.querySelector('img[itemprop="image"]')?.getAttribute('src') ||
                 doc.querySelector('.recipe-image img')?.getAttribute('src') ||
                 doc.querySelector('article img')?.getAttribute('src') ||
                 '/placeholder.svg';

    // Determine category based on content
    const category = determineCategory(title, htmlContent);

    // Extract prep time
    const prepTime = doc.querySelector('[itemprop="totalTime"]')?.textContent?.trim() ||
                    doc.querySelector('.prep-time')?.textContent?.trim();

    // Get source info
    const source = new URL(sourceUrl).hostname.replace('www.', '');

    return {
      title,
      ingredients,
      instructions,
      image,
      category,
      prepTime,
      source,
      sourceUrl
    };
  } catch (error) {
    console.error('Error parsing recipe:', error);
    return {
      title: 'מתכון חדש',
      ingredients: [],
      instructions: [],
      image: '/placeholder.svg',
      category: 'כללי',
      source: 'לא ידוע',
      sourceUrl: ''
    };
  }
};
