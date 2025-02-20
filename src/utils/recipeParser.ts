interface RawRecipeData {
  data: any[];
  status: string;
}

interface YoastData {
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  keywords?: string[];
  articleSection?: string[];
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

interface IngredientSection {
  title: string;
  items: string[];
}

const extractYoastData = (doc: Document): YoastData => {
  const data: YoastData = {};
  
  // נסה לחלץ מידע מה-JSON-LD
  const jsonLd = doc.querySelector('script[type="application/ld+json"].yoast-schema-graph');
  if (jsonLd?.textContent) {
    try {
      const jsonData = JSON.parse(jsonLd.textContent);
      const article = jsonData['@graph']?.find((item: any) => item['@type'] === 'Article');
      if (article) {
        data.author = article.author?.name;
        data.datePublished = article.datePublished;
        data.keywords = article.keywords;
        data.articleSection = article.articleSection;
      }
    } catch (e) {
      console.error('Error parsing JSON-LD:', e);
    }
  }

  // חלץ מידע מתגיות meta
  data.description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  data.image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  
  return data;
};

const parseDescriptionToRecipe = (description: string): { ingredients: string[], instructions: string[] } => {
  const parts = description.split(/אופן הכנה:|אופן ההכנה:/i);
  let ingredients: string[] = [];
  let instructions: string[] = [];

  if (parts.length === 2) {
    // חלק את המצרכים לפי שורות
    ingredients = parts[0]
      .replace(/מצרכים\s*:/, '')
      .split(/\n|,/)
      .map(i => i.trim())
      .filter(i => i.length > 0);

    // חלק את ההוראות לפי מספרים או שורות
    instructions = parts[1]
      .split(/\d+-|\n/)
      .map(i => i.trim())
      .filter(i => i.length > 0);
  }

  return { ingredients, instructions };
};

const cleanTitle = (title: string): string => {
  // הסר האשטאגים ותגיות
  return title
    .replace(/#\w+/g, '') // הסר האשטאגים באנגלית
    .replace(/#[\u0590-\u05FF\w]+/g, '') // הסר האשטאגים בעברית
    .replace(/- YouTube/i, '') // הסר אזכור של יוטיוב
    .split('|')[0] // קח רק את החלק הראשון אם יש מפריד |
    .trim()
    .replace(/\s+/g, ' '); // הסר רווחים מיותרים
};

const extractTitle = (doc: Document): string => {
  // נסה למצוא כותרת מ-h1 בתוך post-header
  const postHeaderH1 = doc.querySelector('.post-header h1.post-title');
  if (postHeaderH1?.textContent) {
    return cleanTitle(postHeaderH1.textContent.trim());
  }

  // נסה למצוא את הכותרת מתגית title
  const titleTag = doc.querySelector('title');
  if (titleTag?.textContent) {
    return cleanTitle(titleTag.textContent.trim());
  }

  // נסה למצוא את הכותרת מתגית og:title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle instanceof HTMLMetaElement && ogTitle.content) {
    return cleanTitle(ogTitle.content.trim());
  }

  // נסה למצוא כותרת מ-h1 כללי
  const h1 = doc.querySelector('h1');
  if (h1?.textContent) {
    return cleanTitle(h1.textContent.trim());
  }

  return 'מתכון חדש';
};

const extractIngredientsFromContent = (content: Element): string[] => {
  const ingredients: string[] = [];
  const paragraphs = content.querySelectorAll('p');
  let foundIngredients = false;
  
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || '';
    
    // זיהוי תחילת רשימת המצרכים
    if (text.includes('מצרכים :') || text.includes('מצרכים:')) {
      foundIngredients = true;
      // הסר את הכותרת "מצרכים:" ופצל לפי שורות
      const items = text.replace(/מצרכים\s*:/, '')
        .split(/\n|<br\s*\/>/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      ingredients.push(...items);
      continue;
    }
    
    // המשך לאסוף מצרכים עד שמגיעים לאופן ההכנה
    if (foundIngredients && !text.includes('אופן ההכנה')) {
      const items = text.split(/\n|<br\s*\/>/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && !item.includes('מצרכים'));
      ingredients.push(...items);
    }
    
    // עצור כשמגיעים לאופן ההכנה
    if (text.includes('אופן ההכנה')) {
      break;
    }
  }
  
  return ingredients;
};

const extractInstructionsFromContent = (content: Element): string[] => {
  const instructions: string[] = [];
  const paragraphs = content.querySelectorAll('p');
  let foundInstructions = false;
  
  for (const p of paragraphs) {
    const text = p.textContent?.trim() || '';
    
    if (text.includes('אופן ההכנה:') || text.includes('אופן כנה:')) {
      foundInstructions = true;
      continue;
    }
    
    if (foundInstructions && text && !text.includes('לסירטון') && !text.includes('youtube.com')) {
      // פצל לפי שורות או מספרים
      const steps = text.split(/\n|<br\s*\/>|\d+[-\)]\s*/)
        .map(step => step.trim())
        .filter(step => step.length > 0);
      instructions.push(...steps);
    }
  }
  
  return instructions;
};

const extractIngredients = (doc: Document): string[] => {
  const sections: IngredientSection[] = [];
  let currentSection: IngredientSection = {
    title: 'מצרכים',
    items: []
  };

  // נסה למצוא את המצרכים מתיאור ה-meta
  const metaDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (metaDescription) {
    const parsed = parseDescriptionToRecipe(metaDescription);
    if (parsed.ingredients.length > 0) {
      return parsed.ingredients;
    }
  }

  // נסה למצוא את המצרכים בתוך post-content
  const postContent = doc.querySelector('.post-content');
  if (postContent) {
    const contentIngredients = extractIngredientsFromContent(postContent);
    if (contentIngredients.length > 0) {
      return contentIngredients;
    }
  }

  // נסה למצוא את חלק המצרכים המובנה
  const ingredientsDiv = doc.querySelector('.ingredients');
  if (ingredientsDiv) {
    // מצא את כותרת הכמות אם קיימת
    const dishAmount = ingredientsDiv.querySelector('.dish-amount h2');
    if (dishAmount?.textContent) {
      currentSection.title = dishAmount.textContent.trim();
    }

    // מצא את כל רשימות המצרכים
    const listTitles = ingredientsDiv.querySelectorAll('.list-title');
    const ingLists = ingredientsDiv.querySelectorAll('.ing-list');

    if (listTitles.length > 0) {
      // אם יש תתי-כותרות, עבור על כל אחת מהן
      listTitles.forEach((titleElement, index) => {
        if (currentSection.items.length > 0) {
          sections.push({...currentSection});
        }

        const title = titleElement.textContent?.trim() || 'מצרכים';
        currentSection = {
          title,
          items: []
        };

        // מצא את רשימת המצרכים המתאימה
        const list = ingLists[index];
        if (list) {
          const items = Array.from(list.querySelectorAll('li'))
            .map(li => li.textContent?.trim())
            .filter((text): text is string => text !== null && text.length > 0);
          currentSection.items.push(...items);
        }
      });
    } else {
      // אם אין תתי-כותרות, אסוף את כל המצרכים מכל הרשימות
      ingLists.forEach(list => {
        const items = Array.from(list.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter((text): text is string => text !== null && text.length > 0);
        currentSection.items.push(...items);
      });
    }

    if (currentSection.items.length > 0) {
      sections.push({...currentSection});
    }

    // הוסף את גודל התבנית אם קיים
    const dishSize = ingredientsDiv.querySelector('.dish-size');
    if (dishSize?.textContent) {
      const sizeText = dishSize.textContent.trim();
      if (sizeText) {
        sections.push({
          title: 'גודל תבנית',
          items: [sizeText]
        });
      }
    }
  } else {
    // אם לא נמצא מבנה מובנה, השתמש בלוגיקה הקודמת
    const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => {
      const text = p.textContent?.trim() || '';
      return text.match(/[\u0590-\u05FF]/) && text.length > 0;
    });
    
    let inIngredientsSection = false;
    
    for (const p of paragraphs) {
      const text = p.textContent?.trim() || '';
      
      if (text.match(/^(מצרכים|למשרה|לרוטב|לציפוי|לקישוט|למילוי)/)) {
        if (currentSection.items.length > 0) {
          sections.push({...currentSection});
        }
        currentSection = {
          title: text,
          items: []
        };
        inIngredientsSection = true;
        continue;
      }
      
      if (inIngredientsSection && 
          text && 
          text.length > 2 && 
          !text.includes('הכנתם?') && 
          !text.includes('איך מכינים') &&
          !text.includes('תייגו אותי')) {
        currentSection.items.push(text);
      }
      
      if (text.includes('איך מכינים')) {
        inIngredientsSection = false;
        if (currentSection.items.length > 0) {
          sections.push({...currentSection});
        }
        break;
      }
    }
    
    if (currentSection.items.length > 0) {
      sections.push({...currentSection});
    }
  }

  // שטח את כל המצרכים לרשימה אחת עם כותרות
  return sections.flatMap(section => {
    if (section.title === 'מצרכים') {
      return section.items;
    }
    return [section.title + ':', ...section.items];
  });
};

const extractInstructions = (doc: Document): string[] => {
  // נסה למצוא הוראות הכנה מתיאור ה-meta
  const metaDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (metaDescription) {
    const parsed = parseDescriptionToRecipe(metaDescription);
    if (parsed.instructions.length > 0) {
      return parsed.instructions;
    }
  }

  // נסה למצוא הוראות הכנה בתוך post-content
  const postContent = doc.querySelector('.post-content');
  if (postContent) {
    const contentInstructions = extractInstructionsFromContent(postContent);
    if (contentInstructions.length > 0) {
      return contentInstructions;
    }
  }

  // נסה למצוא את חלק ההוראות המובנה
  const instructionsDiv = doc.querySelector('.instructions');
  if (instructionsDiv) {
    const items = instructionsDiv.querySelectorAll('.inst-list li');
    const instructions: string[] = [];
    items.forEach(item => {
      const text = item.textContent?.trim();
      if (text) {
        instructions.push(text);
      }
    });
    if (instructions.length > 0) {
      return instructions;
    }
  }
  
  // נסה למצוא הוראות בתוך post-content
  if (postContent) {
    let foundInstructions = false;
    const elements = postContent.children;
    
    for (const element of Array.from(elements)) {
      const text = element.textContent?.trim() || '';
      
      // התחל לאסוף הוראות אחרי שמוצאים כותרת שמתאימה
      if (text.match(/^(אופן|הוראות) ההכנה:?$/i) || text.includes('איך מכינים')) {
        foundInstructions = true;
        continue;
      }
      
      // אם מצאנו הוראות וזה פסקה או פריט ברשימה, הוסף אותו
      if (foundInstructions && 
          (element instanceof HTMLParagraphElement || element instanceof HTMLLIElement) &&
          text &&
          !text.includes('youtube.com') &&
          !text.includes('לסירטון')) {
        instructions.push(text);
      }
    }
  }
  
  // גיבוי: נסה למצוא רשימה ממוספרת אחרי "איך מכינים"
  if (instructions.length === 0) {
    const lists = doc.querySelectorAll('ol');
    for (const list of lists) {
      const prevElement = list.previousElementSibling;
      if (prevElement?.textContent?.includes('איך מכינים')) {
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          const text = item.textContent?.trim();
          if (text) {
            instructions.push(text);
          }
        });
        break;
      }
    }
  }

  return instructions;
};

const extractImage = (doc: Document): string => {
  // נסה למצוא תמונה בתוך div.img-wrap
  const imgWrapImg = doc.querySelector('.img-wrap img');
  if (imgWrapImg instanceof HTMLImageElement) {
    // אם יש srcset, קח את התמונה הגדולה ביותר
    if (imgWrapImg.srcset) {
      const srcsetUrls = imgWrapImg.srcset.split(',')
        .map(s => s.trim().split(' ')[0])
        .filter(Boolean);
      if (srcsetUrls.length > 0) {
        return srcsetUrls[0];
      }
    }
    return imgWrapImg.src;
  }

  // אם לא נמצאה תמונה ב-img-wrap, נסה למצוא את התמונה הראשית
  const wpImage = doc.querySelector('.wp-post-image, .attachment-tinysalt_large');
  if (wpImage instanceof HTMLImageElement) {
    // אם יש srcset, קח את התמונה הגדולה ביותר
    if (wpImage.srcset) {
      const srcsetUrls = wpImage.srcset.split(',')
        .map(s => s.trim().split(' ')[0])
        .filter(Boolean);
      if (srcsetUrls.length > 0) {
        return srcsetUrls[0];
      }
    }
    return wpImage.src;
  }

  // נסה למצוא תמונה בסקציית המדיה
  const featuredImage = doc.querySelector('.featured-media-section img');
  if (featuredImage instanceof HTMLImageElement) {
    return featuredImage.src;
  }

  return '/placeholder.svg';
};

const extractYoutubeUrl = (doc: Document): string | undefined => {
  const youtubeIframe = doc.querySelector('iframe[src*="youtube.com"]');
  if (youtubeIframe) {
    const src = youtubeIframe.getAttribute('src');
    if (src) {
      // הסר פרמטרים מיותרים מה-URL
      const url = new URL(src);
      if (url.hostname.includes('youtube.com')) {
        // שמור רק את המזהה של הסרטון
        const videoId = url.pathname.split('/').pop() || 
                       url.searchParams.get('v') ||
                       '';
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return src;
    }
  }

  const youtubeLink = doc.querySelector('a[href*="youtube.com"]');
  return youtubeLink?.getAttribute('href');
};

const getCredits = (doc: Document): { author?: string, credits?: string } => {
  let author = doc.querySelector('meta[name="author"]')?.getAttribute('content');
  if (!author) {
    author = doc.querySelector('[itemprop="author"]')?.textContent?.trim();
  }
  if (!author) {
    author = doc.querySelector('.author, .recipe-author')?.textContent?.trim();
  }

  let credits = doc.querySelector('.credits, .recipe-credits')?.textContent?.trim();
  
  return { author, credits };
};

export const parseRecipeData = (rawData: RawRecipeData, sourceUrl: string) => {
  try {
    console.log('Starting recipe parsing...');
    const htmlContent = rawData.data[0]?.html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const yoastData = extractYoastData(doc);
    console.log('Extracted Yoast data:', yoastData);
    
    const title = extractTitle(doc);
    console.log('Extracted title:', title);
    
    const image = yoastData.image || extractImage(doc);
    console.log('Extracted image:', image);
    
    const ingredients = extractIngredients(doc);
    console.log('Extracted ingredients:', ingredients.length);
    
    const instructions = extractInstructions(doc);
    console.log('Extracted instructions:', instructions.length);

    const { author, credits } = getCredits(doc);

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
      author: yoastData.author || author,
      credits,
      siteCategories: yoastData.articleSection || 
                     yoastData.keywords || 
                     Array.from(doc.querySelectorAll('.categories a, .breadcrumbs a'))
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
