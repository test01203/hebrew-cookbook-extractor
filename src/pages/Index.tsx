
import { useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeDialog } from "@/components/RecipeDialog";
import { RecipeImporter } from "@/components/RecipeImporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  image: string;
  category: string;
  prepTime?: string;
  ingredients: string[];
  instructions: string[];
}

const Index = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleImport = (importedRecipe: Omit<Recipe, "id">) => {
    const newRecipe = {
      ...importedRecipe,
      id: Date.now().toString(),
    };
    setRecipes((prev) => [...prev, newRecipe]);
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <div className="relative animate-fade-up">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חפש מתכונים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
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
                  prepTime={recipe.prepTime}
                  onClick={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "לא נמצאו מתכונים התואמים את החיפוש"
                  : "התחל לייבא מתכונים כדי למלא את ספר המתכונים שלך"}
              </p>
              {!searchTerm && (
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
      />
    </div>
  );
};

export default Index;
