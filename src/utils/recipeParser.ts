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
  const wpImage = doc.querySelector('.wp-post-image, .attachment-tinysalt_large');
  if (wpImage instanceof HTMLImageElement && wpImage.alt) {
    return wpImage.alt.trim();
  }

  const h1 = doc.querySelector('h1');
  if (h1?.textContent) {
    return h1.textContent.trim();
  }

  return 'מתכון חדש';
};

const extractImage = (doc: Document): string => {
  const wpImage = doc.querySelector('.wp-post-image, .attachment-tinysalt_large');
  if (wpImage instanceof HTMLImageElement) {
    if (wpImage.srcset) {
      // נסה לקחת ��ת התמונה הכי גדולה מה-srcset
      const srcsetUrls = wpImage.srcset.split(',')
        .map(s => s.trim().split(' ')[0])
        .filter(Boolean);
      if (srcsetUrls.length > 0) {
        return srcsetUrls[0];
      }
    }
    return wpImage.src;
  }

  const featuredImage = doc.querySelector('.featured-media-section img');
  if (featuredImage instanceof HTMLImageElement) {
    return featuredImage.src;
  }

  return '/placeholder.svg';
};

interface IngredientSection {
  title: string;
  items: string[];
}

const extractIngredients = (doc: Document): IngredientSection[] => {
  const sections: IngredientSection[] = [];
  let currentSection: IngredientSection = {
    title: 'מצרכים',
    items: []
  };
  
  const paragraphs = doc.querySelectorAll('p[dir="rtl"]');
  let inIngredientsSection = false;
  
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || '';
    
    // בדוק אם זו כותרת חדשה
    if (text.match(/^(מצרכים|למשרה|לרוטב|לציפוי|לקישוט|למילוי)/)) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: text,
        items: []
      };
      inIngredientsSection = true;
      continue;
    }
    
    // אם יש טקסט משמעותי והוא לא כותרת או טקסט מיוחד
    if (inIngredientsSection && 
        text && 
        text.length > 2 && 
        !text.includes('הכנתם?') && 
        !text.includes('איך מכינים') &&
        !text.includes('תייגו אותי')) {
      currentSection.items.push(text);
    }
    
    // עצור כשמגיעים להוראות ההכנה
    if (text.includes('איך מכינים')) {
      inIngredientsSection = false;
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      break;
    }
  }
  
  // הוסף את הסקציה האחרונה אם יש בה פריטים
  if (currentSection.items.length > 0 && !sections.includes(currentSection)) {
    sections.push(currentSection);
  }
  
  return sections;
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
    const image = extractImage(doc);
    const ingredientSections = extractIngredients(doc);
    
    // שטח את כל המצרכים לרשימה אחת עם כותרות
    const ingredients = ingredientSections.flatMap(section => {
      if (section.title === 'מצרכים') {
        return section.items;
      }
      return [section.title + ':', ...section.items];
    });
    
    const instructions = extractInstructions(doc);
    
    console.log('Parsed Recipe:', { 
      title, 
      image, 
      ingredientSections,
      instructions: instructions.length 
    });

    return {
      title,
      ingredients,
      instructions,
      image,
      category: determineCategory(title, htmlContent),
      prepTime: doc.querySelector('[itemprop="totalTime"], .prep-time, .cooking-time')?.textContent?.trim(),
      source: new URL(sourceUrl).hostname.replace('www.', ''),
      sourceUrl,
      youtubeUrl: extractYoutubeUrl(doc),
      author: getCredits(doc).author,
      credits: getCredits(doc).credits,
      siteCategories: Array.from(doc.querySelectorAll('.categories a, .breadcrumbs a'))
        .map(el => el.textContent?.trim())
        .filter(Boolean) as string[]
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
