
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ImportedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  category?: string;
  prepTime?: string;
}

export function RecipeImporter({ onImport }: { onImport: (recipe: ImportedRecipe) => void }) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);

    try {
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success && result.data) {
        // Process the crawled data to extract recipe information
        const recipeData = processRecipeData(result.data);
        onImport(recipeData);
        toast({
          title: "מתכון יובא בהצלחה",
          description: "המתכון נוסף לספר המתכונים שלך",
        });
      } else {
        toast({
          title: "שגיאה",
          description: "לא הצלחנו לייבא את המתכון. נסה שנית",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing recipe:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת ייבוא המתכון",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const processRecipeData = (data: any): ImportedRecipe => {
    // This is a placeholder implementation
    // You'll need to implement proper parsing logic based on the crawled data
    return {
      title: data.title || "מתכון חדש",
      ingredients: data.ingredients || [],
      instructions: data.instructions || [],
      image: data.image,
      category: data.category || "כללי",
      prepTime: data.prepTime,
    };
  };

  return (
    <Card className="p-6 animate-fade-in">
      <form onSubmit={handleImport} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">ייבא מתכון חדש</h3>
          <p className="text-sm text-muted-foreground">
            הכנס קישור למתכון שברצונך לייבא
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "מייבא..." : "ייבא"}
          </Button>
        </div>
        {isLoading && <Progress value={progress} className="w-full" />}
      </form>
    </Card>
  );
}
