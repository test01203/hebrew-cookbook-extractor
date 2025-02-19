
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
    const scripts = doc.querySelectorAll('script[type="application/json"]');
    for (const script of scripts) {
      const content = script.textContent;
      if (content) {
        const data = JSON.parse(content);
        if (data?.props?.pageProps?.itemInfo?.itemStruct) {
          const videoData = data.props.pageProps.itemInfo.itemStruct;
          const videoId = videoData.id;
          // נוסיף תמיכה בפורמט החדש של TikTok
          const embedUrl = videoId.startsWith('v') 
            ? `https://www.tiktok.com/embed/v2/${videoId}`
            : `https://www.tiktok.com/embed/${videoId}`;
            
          return {
            title: videoData.desc || 'מתכון טיקטוק',
            description: videoData.desc || '',
            embedUrl
          };
        }
      }
    }
    
    // אם לא מצאנו בפורמט הרגיל, ננסה לחלץ מה-URL
    const videoIdMatch = sourceUrl.match(/video\/(\d+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      return {
        title: doc.title || 'מתכון טיקטוק',
        description: '',
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`
      };
    }
    
    return null;
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

  for (const line of lines) {
    if (line.includes('מצרכים') || line.includes('חומרים')) {
      currentSection = 'ingredients';
      continue;
    } else if (line.includes('אופן הכנה') || line.includes('הוראות הכנה')) {
      currentSection = 'instructions';
      continue;
    }

    if (currentSection === 'ingredients') {
      ingredients.push(line);
    } else if (currentSection === 'instructions') {
      instructions.push(line);
    }
  }

  // אם אין חלוקה ברורה, ננסה לזהות לפי תבנית
  if (ingredients.length === 0 && instructions.length === 0) {
    for (const line of lines) {
      if (line.match(/^[\d.-]/) || line.match(/^[א-ת]+ *:/)) {
        ingredients.push(line);
      } else if (line.length > 10) {
        instructions.push(line);
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
