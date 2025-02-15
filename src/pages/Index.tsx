
import { useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDialog } from "@/components/RecipeDialog";
import { RecipeImporter } from "@/components/RecipeImporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
  "הכל",
  "עוגות",
  "עוגיות",
  "לחמים",
  "קינוחים",
  "מתוקים",
  "מאפים",
  "ארוחות",
  "סלטים",
  "כללי",
];

const Index = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const { toast } = useToast();

  const handleImport = (importedRecipe: Omit<Recipe, "id">) => {
    const newRecipe = {
      ...importedRecipe,
      id: Date.now().toString(),
    };
    setRecipes((prev) => [...prev, newRecipe]);
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter(recipe => recipe.id !== id));
    toast({
      title: "המתכון נמחק",
      description: "המתכון הוסר מספר המתכונים שלך",
    });
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "הכל" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const focusImportInput = () => {
    const input = document.querySelector('input[type="url"]') as HTMLInputElement | null;
    input?.focus();
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold">ספר המתכונים שלי</h1>
          <p className="text-muted-foreground">
            ייבא וארגן את המתכונים האהובים עליך במקום אחד
          </p>
        </div>

        <RecipeImporter onImport={handleImport} />

        <div className="flex flex-col gap-4 animate-fade-up">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="חפש מתכונים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <ScrollArea className="w-full border rounded-lg p-4">
            <ToggleGroup
              type="single"
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value || "הכל")}
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((category) => (
                <ToggleGroupItem
                  key={category}
                  value={category}
                  aria-label={category}
                  className="px-3 py-1 rounded-full"
                >
                  {category}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScrollArea>
        </div>

        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  title={recipe.title}
                  image={recipe.image}
                  category={recipe.category}
                  source={recipe.source}
                  prepTime={recipe.prepTime}
                  onClick={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "הכל"
                  ? "לא נמצאו מתכונים התואמים את החיפוש"
                  : "התחל לייבא מתכונים כדי למלא את ספר המתכונים שלך"}
              </p>
              {!searchTerm && selectedCategory === "הכל" && (
                <Button
                  variant="outline"
                  onClick={focusImportInput}
                >
                  ייבא מתכון ראשון
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <RecipeDialog
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onDelete={handleDeleteRecipe}
      />
    </div>
  );
};

export default Index;
