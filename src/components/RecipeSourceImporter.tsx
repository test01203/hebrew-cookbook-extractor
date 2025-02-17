
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { parseRecipeData } from "@/utils/recipeParser";
import { Loader2 } from "lucide-react";

const RECIPE_SOURCES = [
  {
    id: "aharoni",
    name: "ישראל אהרוני",
    url: "https://www.israelaharoni.co.il/category/%D7%9E%D7%AA%D7%9B%D7%95%D7%A0%D7%99%D7%9D/",
    logo: "/placeholder.svg"
  }
];

interface RecipePreview {
  id: string;
  title: string;
  url: string;
  selected: boolean;
}

interface Props {
  onImport: (recipes: any[]) => void;
}

export function RecipeSourceImporter({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<typeof RECIPE_SOURCES[0] | null>(null);
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSourceSelect = async (source: typeof RECIPE_SOURCES[0]) => {
    setSelectedSource(source);
    setLoading(true);
    setProgress(0);
    
    try {
      const result = await FirecrawlService.crawlWebsite(source.url);
      if (result.success && result.data) {
        // מוציא את כל הקישורים למתכונים מהדף הראשי
        const links = Array.from(new DOMParser().parseFromString(result.data.data[0].html, 'text/html')
          .querySelectorAll('a[href*="recipe"]'))
          .map(a => a.getAttribute('href'))
          .filter((href): href is string => href !== null && href.includes('recipe'))
          .map(url => ({
            id: url,
            title: url.split('/').pop()?.replace(/-/g, ' ') || 'מתכון',
            url,
            selected: false
          }));

        setRecipes(links);
        setProgress(100);
      } else {
        toast({
          title: "שגיאה",
          description: "לא הצלחנו לטעון את רשימת המתכונים",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת המתכונים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipe = (id: string) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === id ? { ...recipe, selected: !recipe.selected } : recipe
    ));
  };

  const handleImport = async () => {
    const selectedRecipes = recipes.filter(r => r.selected);
    if (selectedRecipes.length === 0) {
      toast({
        title: "שגיאה",
        description: "נא לבחור לפחות מתכון אחד",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const importedRecipes = [];
    let currentProgress = 0;

    try {
      for (const recipe of selectedRecipes) {
        const result = await FirecrawlService.crawlWebsite(recipe.url);
        if (result.success && result.data) {
          const parsedRecipe = parseRecipeData(result.data, recipe.url);
          importedRecipes.push(parsedRecipe);
        }
        currentProgress = (importedRecipes.length / selectedRecipes.length) * 100;
        setProgress(currentProgress);
      }

      onImport(importedRecipes);
      toast({
        title: "הצלחה",
        description: `יובאו ${importedRecipes.length} מתכונים בהצלחה`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בייבוא המתכונים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        ייבא מאתרי מתכונים
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>ייבוא מאתרי מתכונים</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {!selectedSource ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {RECIPE_SOURCES.map(source => (
                  <Button
                    key={source.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => handleSourceSelect(source)}
                  >
                    <img src={source.logo} alt={source.name} className="w-16 h-16 object-contain" />
                    <span>{source.name}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSource(null);
                    setRecipes([]);
                  }}
                >
                  ← חזרה לרשימת האתרים
                </Button>

                {loading ? (
                  <div className="text-center py-8 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      טוען מתכונים...
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-2">
                      {recipes.map(recipe => (
                        <div
                          key={recipe.id}
                          className="flex items-center space-x-2 space-x-reverse"
                        >
                          <Checkbox
                            id={recipe.id}
                            checked={recipe.selected}
                            onCheckedChange={() => toggleRecipe(recipe.id)}
                          />
                          <label
                            htmlFor={recipe.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {recipe.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {recipes.length > 0 && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSource(null)}
                      disabled={loading}
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={loading || !recipes.some(r => r.selected)}
                    >
                      {loading ? "מייבא..." : "ייבא מתכונים נבחרים"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
