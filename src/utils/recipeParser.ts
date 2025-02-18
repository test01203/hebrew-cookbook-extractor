interface RawRecipeData {
  data: any[];
  status: string;
}

const CATEGORIES_MAP: { [key: string]: string[] } = {
  'עוגות': ['עוגה', 'עוגות', 'עוגת', 'טורט'],
  'עוגיות': ['עוגיות', 'עוגיה', 'ביסקוטי'],
  'לחמים': ['לחם', 'ח��ה', 'בייגל', 'פ��תה'],
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

const extractTitle = (doc: Document): string => {
  // חיפוש במספר מקומות אפשריים לכותרת
  const possibleElements = [
    ...Array.from(doc.querySelectorAll('h1')),
    ...Array.from(doc.querySelectorAll('.recipe-title')),
    ...Array.from(doc.querySelectorAll('.entry-title')),
    ...Array.from(doc.querySelectorAll('.wp-post-image')),
  ];

  for (const element of possibleElements) {
    let text = '';
    if (element instanceof HTMLImageElement) {
      text = element.alt;
    } else {
      text = element.textContent || '';
    }
    
    if (text?.trim() && text.length > 2) {
      return text.trim();
    }
  }

  return 'מתכון חדש';
};

const extractImage = (doc: Document, sourceUrl: string): string => {
  // חיפוש במספר מקומות אפשריים לתמונה
  const imageSelectors = [
    '.attachment-tinysalt_large',
    '.wp-post-image',
    '.featured-media-section img',
    'header img',
    'article img:first-of-type'
  ];

  for (const selector of imageSelectors) {
    const img = doc.querySelector(selector);
    if (img && img instanceof HTMLImageElement) {
      const src = img.src || img.getAttribute('src');
      if (src && !src.includes('placeholder')) {
        // נסה לקבל את התמונה הגדולה ביותר מה-srcset אם קיים
        if (img.srcset) {
          const srcsetUrls = img.srcset.split(',')
            .map(s => s.trim().split(' ')[0])
            .filter(Boolean);
          if (srcsetUrls.length > 0) {
            return srcsetUrls[0];
          }
        }
        return src;
      }
    }
  }

  return '/placeholder.svg';
};

const extractIngredients = (doc: Document): string[] => {
  const ingredients: string[] = [];
  let currentSection = '';
  
  // עבור על כל הפסקאות בדף
  const paragraphs = doc.querySelectorAll('p[dir="rtl"]');
  
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || '';
    
    // בדיקה אם זו כותרת של סקציית מצרכים
    if (text.includes('מצרכים') || 
        text.includes('למשרה') || 
        text.includes('לרוטב') || 
        text.includes('לציפוי') || 
        text.includes('לקישוט') || 
        text.includes('למילוי')) {
      currentSection = text;
      continue;
    }
    
    // אם יש טקסט משמעותי והוא לא כותרת של סקציה חדשה
    if (text && 
        text.length > 2 && 
        !text.includes('הכנתם?') && 
        !text.includes('איך מכינים') &&
        !text.includes('תייגו אותי')) {
      
      // הוסף את שם הסקציה אם זו לא סקציית המצרכים הראשית
      if (currentSection && !currentSection.includes('מצרכים')) {
        ingredients.push(`${currentSection}:`);
      }
      
      ingredients.push(text);
    }
    
    // עצור כשמגיעים להוראות ההכנה
    if (text.includes('איך מכינים')) {
      break;
    }
  }
  
  return ingredients;
};

const extractInstructions = (doc: Document): string[] => {
  const instructions: string[] = [];
  let foundInstructions = false;
  
  // חפש רשימה ממוספרת אחרי "איך מכינים"
  const lists = doc.querySelectorAll('ol');
  
  for (const list of lists) {
    // בדוק אם לפני הרשימה יש כותרת "איך מכינים"
    const prevElement = list.previousElementSibling;
    if (prevElement?.textContent?.includes('איך מכינים')) {
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        const text = item.textContent?.trim();
        if (text) {
          instructions.push(text);
          foundInstructions = true;
        }
      });
      
      if (foundInstructions) {
        break;
      }
    }
  }
  
  return instructions;
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
    
    const title = extractTitle(doc);
    const image = extractImage(doc, sourceUrl);
    const ingredients = extractIngredients(doc);
    const instructions = extractInstructions(doc);
    
    console.log('Parsed Recipe:', { 
      title, 
      image, 
      ingredients: ingredients.length,
      instructions: instructions.length 
    });

    const { author, credits } = getCredits(doc);

    const siteCategories = Array.from(doc.querySelectorAll('.categories a, .breadcrumbs a'))
      .map(el => el.textContent?.trim())
      .filter(Boolean) as string[];

    const category = determineCategory(title, htmlContent);

    const prepTime = doc.querySelector('[itemprop="totalTime"], .prep-time, .cooking-time')?.textContent?.trim();

    return {
      title,
      ingredients,
      instructions,
      image,
      category,
      prepTime,
      source: new URL(sourceUrl).hostname.replace('www.', ''),
      sourceUrl,
      youtubeUrl: extractYoutubeUrl(doc),
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
