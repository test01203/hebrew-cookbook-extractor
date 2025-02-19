
interface TiktokRawData {
  data: any[];
  status: string;
}

interface TiktokVideo {
  title: string;
  description: string;
  embedUrl: string;
}

const extractTiktokContent = (doc: Document, sourceUrl: string): TiktokVideo | null => {
  try {
    // קודם ננסה למצוא את מזהה הסרטון מה-URL
    const videoIdMatch = sourceUrl.match(/video\/(\d+)/);
    if (!videoIdMatch) {
      console.error('Could not extract video ID from URL');
      return null;
    }

    const videoId = videoIdMatch[1];
    const embedUrl = `https://www.tiktok.com/embed/${videoId}`;

    // חיפוש המידע במספר מיקומים אפשריים
    let title = '';
    let description = '';

    // חיפוש בתגיות meta
    const metaTitle = doc.querySelector('meta[property="og:title"]');
    const metaDescription = doc.querySelector('meta[property="og:description"]');
    
    if (metaTitle) {
      title = metaTitle.getAttribute('content') || '';
    }
    
    if (metaDescription) {
      description = metaDescription.getAttribute('content') || '';
    }

    // אם לא מצאנו בתגיות meta, ננסה למצוא בתוכן הדף
    if (!title || !description) {
      const scripts = doc.querySelectorAll('script[type="application/json"]');
      for (const script of scripts) {
        const content = script.textContent;
        if (content) {
          try {
            const data = JSON.parse(content);
            if (data?.props?.pageProps?.itemInfo?.itemStruct) {
              const videoData = data.props.pageProps.itemInfo.itemStruct;
              if (!title) title = videoData.desc || '';
              if (!description) description = videoData.desc || '';
              break;
            }
          } catch (e) {
            console.error('Error parsing JSON from script tag:', e);
          }
        }
      }
    }

    // אם עדיין לא מצאנו כותרת או תיאור, נשתמש בברירת מחדל
    if (!title) title = 'מתכון טיקטוק';
    if (!description) description = '';

    console.log('Extracted TikTok content:', { videoId, title, description });

    return {
      title,
      description,
      embedUrl
    };
  } catch (error) {
    console.error('Error extracting TikTok content:', error);
    return null;
  }
};

const extractTiktokRecipeContent = (description: string): { ingredients: string[], instructions: string[] } => {
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean);
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let currentSection: 'ingredients' | 'instructions' | null = null;

  // קודם ננסה למצוא סימנים מובהקים של חלקי המתכון
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // זיהוי כותרות של חלקי המתכון
    if (lowerLine.includes('מצרכים') || 
        lowerLine.includes('חומרים') ||
        lowerLine.includes('רכיבים')) {
      currentSection = 'ingredients';
      continue;
    } 
    
    if (lowerLine.includes('אופן הכנה') || 
        lowerLine.includes('הוראות הכנה') ||
        lowerLine.includes('הכנה:')) {
      currentSection = 'instructions';
      continue;
    }

    // הוספת השורה לחלק המתאים
    if (currentSection === 'ingredients' && line.length > 1) {
      ingredients.push(line);
    } else if (currentSection === 'instructions' && line.length > 1) {
      instructions.push(line);
    }
  }

  // אם לא מצאנו חלוקה ברורה, ננסה לזהות לפי תבנית
  if (ingredients.length === 0 && instructions.length === 0) {
    let foundList = false;
    
    for (const line of lines) {
      // מזהה שורות שנראות כמו רכיבים
      if (line.match(/^[-•*]|\d+\.|\d+\s*(גרם|כפית|כף|כוס|מ"ל|ק"ג)/)) {
        ingredients.push(line);
        foundList = true;
      }
      // שורות ארוכות יותר שמגיעות אחרי רשימת הרכיבים הן כנראה הוראות
      else if (foundList && line.length > 10) {
        instructions.push(line);
      }
      // שורות קצרות בהתחלה הן כנראה רכיבים
      else if (!foundList && line.length > 1) {
        ingredients.push(line);
      }
    }
  }

  return { ingredients, instructions };
};

export const parseTiktokRecipe = async (rawData: TiktokRawData, sourceUrl: string) => {
  try {
    const htmlContent = rawData.data[0]?.html || '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const tiktokContent = extractTiktokContent(doc, sourceUrl);
    if (!tiktokContent) {
      throw new Error('Could not extract TikTok content');
    }

    const { ingredients, instructions } = extractTiktokRecipeContent(tiktokContent.description);

    console.log('Parsed TikTok Recipe:', {
      title: tiktokContent.title,
      ingredients: ingredients.length,
      instructions: instructions.length,
      embedUrl: tiktokContent.embedUrl
    });

    return {
      title: tiktokContent.title,
      ingredients,
      instructions,
      image: '/placeholder.svg',
      category: 'טיקטוק',
      source: 'TikTok',
      sourceUrl,
      youtubeUrl: undefined,
      tiktokUrl: tiktokContent.embedUrl,
      siteCategories: ['טיקטוק']
    };
  } catch (error) {
    console.error('Error parsing TikTok recipe:', error);
    return {
      title: 'מתכון טיקטוק',
      ingredients: [],
      instructions: [],
      image: '/placeholder.svg',
      category: 'טיקטוק',
      source: 'TikTok',
      sourceUrl,
      siteCategories: ['טיקטוק']
    };
  }
};
