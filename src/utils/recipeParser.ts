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
  'לחמים': ['לחם', 'ח��ה', 'בייגל', 'פיתה'],
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
    // חלק את המaskets לפי שורות
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

const extractIngredients = (doc: Document): string[] => {
  const sections: IngredientSection[] = [];
  let currentSection: IngredientSection = {
    title: 'מצרכים',
    items: []
  };

  // נסה למצוא את המaskets מתיאור ה-meta
  const metaDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (metaDescription) {
    const parsed = parseDescriptionToRecipe(metaDescription);
    if (parsed.ingredients.length > 0) {
      return parsed.ingredients;
    }
  }

  // נסה למצוא את חלק המaskets המובנה
  const ingredientsDiv = doc.querySelector('.ingredients');
  if (ingredientsDiv) {
    // מצא את כותרת הכמות אם קיימת
    const dishAmount = ingredientsDiv.querySelector('.dish-amount h2');
    if (dishAmount?.textContent) {
      currentSection.title = dishAmount.textContent.trim();
    }

    // מצא את כל רשימות המaskets
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

        // מצא את רשימת המaskets המתאימה
        const list = ingLists[index];
        if (list) {
          const items = Array.from(list.querySelectorAll('li'))
            .map(li => li.textContent?.trim())
            .filter((text): text is string => text !== null && text.length > 0);
          currentSection.items.push(...items);
        }
      });
    } else {
      // אם אין תתי-כותרות, אסוף את כל המaskets מכל הרשימות
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

  // שטח את כל המaskets לרשימה אחת עם כותרות
  return sections.flatMap(section => {
    if (section.title === 'מצרכים') {
      return section.items;
    }
    return [section.title + ':', ...section.items];
  });
};

const extractInstructions = (doc: Document): string[] => {
  const instructions: string[] = [];
  
  // נסה למצוא הוראות הכנה מתיאור ה-meta
  const metaDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (metaDescription) {
    const parsed = parseDescriptionToRecipe(metaDescription);
    if (parsed.instructions.length > 0) {
      return parsed.instructions;
    }
  }

  // נסה למצוא הוראות בתוך post-content
  const postContent = doc.querySelector('.post-content');
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

const extractTitle = (doc: Document): string => {
  // נסה למצוא את הכותרת מתגית title
  const titleTag = doc.querySelector('title');
  if (titleTag?.textContent) {
    return titleTag.textContent.trim();
  }

  // נסה למצוא את הכותרת מתגית og:title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle instanceof HTMLMetaElement && ogTitle.content) {
    return ogTitle.content.trim();
  }

  // נסה למצוא כותרת מ-h1
  const h1 = doc.querySelector('h1');
  if (h1?.textContent) {
    const h1Text = h1.textContent.trim();
    if (h1Text && h1Text.length > 2) {
      return h1Text;
    }
  }

  // נסה למצוא כותרת מתמונה ראשית בסקציית המדיה
  const featuredImage = doc.querySelector('.featured-media-section img');
  if (featuredImage instanceof HTMLImageElement && featuredImage.alt) {
    const featuredAlt = featuredImage.alt.trim();
    if (featuredAlt && featuredAlt.length > 2) {
      return featuredAlt;
    }
  }

  return 'מתכון חדש';
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
