
import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY = 'fc-c60f659436cb4cbe849bf8a9125223eb';
  private static firecrawlApp: FirecrawlApp | null = null;

  private static getInstance(): FirecrawlApp {
    if (!this.firecrawlApp) {
      this.firecrawlApp = new FirecrawlApp({ apiKey: this.API_KEY });
    }
    return this.firecrawlApp;
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const app = this.getInstance();
      const crawlResponse = await app.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          waitUntil: 'networkidle0',
          selectors: ['#SIGI_STATE', 'meta[property="og:title"]', 'meta[property="og:description"]']
        }
      }) as CrawlResponse;

      if (!crawlResponse.success) {
        return { 
          success: false, 
          error: (crawlResponse as ErrorResponse).error || 'Failed to crawl website' 
        };
      }

      return { 
        success: true,
        data: crawlResponse 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}
