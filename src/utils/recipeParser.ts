
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
  'ארוחות': ['ארוחה', 'תבשיל', 'מרק', 'פסטה', 'אורז', 'סלט'],
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
  
  // חיפוש בתוך אזורי ההוראות הספציפיים
  const instructionWrappers = doc.querySelectorAll('.preparation, .instructions, [itemprop="recipeInstructions"], .recipe-instructions, .method, .steps, ol');
  
  for (const wrapper of instructionWrappers) {
    const items = wrapper.querySelectorAll('li, p');
    let foundValidInstructions = false;
    
    items.forEach(item => {
      const text = item.textContent?.trim();
      if (text && text.length > 5 && 
          !text.includes('עמוד הבית') && 
          !text.includes('קטגוריות') &&
          !text.includes('חפש') &&
          !text.includes('תפריט')) {
        // נקה מספרים מתחילת השורה
        const cleanText = text.replace(/^\d+[\.\)]\s*/, '');
        if (!instructions.includes(cleanText)) {
          instructions.push(cleanText);
          foundValidInstructions = true;
        }
      }
    });
    
    if (foundValidInstructions) break;
  }

  return instructions;
};

const extractIngredients = (doc: Document): string[] => {
  const ingredients: string[] = [];
  const sections = ['מצרכים', 'למשרה', 'לרוטב', 'לציפוי', 'לקישוט', 'למילוי'];
  
  const allParagraphs = doc.querySelectorAll('p[dir="rtl"]');
  let isInIngredientsSection = false;
  
  for (const p of allParagraphs) {
    const text = p.textContent?.trim();
    if (!text) continue;
    
    // בדיקה אם זו כותרת של סקציית מצרכים
    const isPotentialHeader = text.length < 30 && sections.some(section => text.includes(section));
    
    if (isPotentialHeader) {
      isInIngredientsSection = true;
      continue;
    }
    
    // אם אנחנו בתוך סקציית מצרכים ויש טקסט משמעותי
    if (isInIngredientsSection && text.length > 2 && !text.includes('הכנתם?') && !text.includes('איך מכינים')) {
      if (!text.startsWith('מצרכים') && !sections.includes(text)) {
        ingredients.push(text);
      }
    }
    
    // עצירה כשמגיעים לסקציית ההכנה
    if (text.includes('איך מכינים')) {
      isInIngredientsSection = false;
    }
  }
  
  return ingredients;
};

const extractYoutubeUrl = (doc: Document): string | undefined => {
  // חיפוש iframe של יוטיוב
  const youtubeIframe = doc.querySelector('iframe[src*="youtube.com"]');
  if (youtubeIframe) {
    return youtubeIframe.getAttribute('src') || undefined;
  }

  // חיפוש קישור ליוטיוב
  const youtubeLink = doc.querySelector('a[href*="youtube.com"]');
  return youtubeLink?.getAttribute('href');
};

const getCredits = (doc: Document): { author?: string, credits?: string } => {
  let author = doc.querySelector('[itemprop="author"]')?.textContent?.trim();
  if (!author) {
    author = doc.querySelector('.author, .recipe-author')?.textContent?.trim();
  }

  let credits = doc.querySelector('.credits, .recipe-credits')?.textContent?.trim();
  
  return { author, credits };
};

export const parseRecipeData = (rawData: RawRecipeData, sourceUrl: string) => {
  try {
    const htmlContent = rawData.data[0]?.html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract title
    const title = doc.querySelector('h1')?.textContent?.trim() || 
                 doc.querySelector('.recipe-title')?.textContent?.trim() ||
                 'מתכון חדש';

    // Extract ingredients
    const ingredients = extractIngredients(doc);

    // Extract instructions
    const instructions = extractInstructions(doc);

    // Extract featured image
    let image = doc.querySelector('.featured-media-section img')?.getAttribute('src') ||
                doc.querySelector('img[itemprop="image"]')?.getAttribute('src') ||
                doc.querySelector('img.wp-post-image')?.getAttribute('src') ||
                doc.querySelector('article img, .recipe-image img, .main-image img')?.getAttribute('src');
    
    // נקה את כתובת התמונה
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, sourceUrl).href;
      } catch {
        image = '/placeholder.svg';
      }
    }
    
    if (!image) {
      image = '/placeholder.svg';
    }

    // Get YouTube video if exists
    const youtubeUrl = extractYoutubeUrl(doc);

    // Get source and credits
    const source = new URL(sourceUrl).hostname.replace('www.', '');
    const { author, credits } = getCredits(doc);

    // Extract categories from the source
    const siteCategories = Array.from(doc.querySelectorAll('.categories a, .breadcrumbs a'))
      .map(el => el.textContent?.trim())
      .filter(Boolean) as string[];

    // Determine recipe category
    const category = determineCategory(title, htmlContent);

    // Extract prep time
    const prepTime = doc.querySelector('[itemprop="totalTime"], .prep-time, .cooking-time')?.textContent?.trim();

    return {
      title,
      ingredients,
      instructions,
      image,
      category,
      prepTime,
      source,
      sourceUrl,
      youtubeUrl,
      author,
      credits,
      siteCategories
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
      sourceUrl: '',
      siteCategories: []
    };
  }
};
