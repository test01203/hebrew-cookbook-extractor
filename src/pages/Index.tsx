
import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeImporter } from "@/components/RecipeImporter";
import { RecipeSourceImporter } from "@/components/RecipeSourceImporter";
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
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const { toast } = useToast();

  useEffect(() => {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  const handleImport = (importedRecipe: Omit<Recipe, "id">) => {
    const newRecipe = {
      ...importedRecipe,
      id: Date.now().toString(),
    };
    setRecipes((prev) => [...prev, newRecipe]);
    toast({
      title: "המתכון נוסף בהצלחה",
      description: "המתכון נשמר בספר המתכונים שלך",
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
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="relative h-[40vh] bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center space-y-6 px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">ספר המתכונים שלי</h1>
          <p className="text-xl text-gray-600">
            ייבא וארגן את המתכונים האהובים עליך במקום אחד
          </p>
          <RecipeImporter onImport={handleImport} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="חפש מתכונים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-gray-50 border-gray-200"
              />
            </div>

            <ScrollArea className="w-full">
              <ToggleGroup
                type="single"
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value || "הכל")}
                className="flex flex-wrap gap-2 p-2"
              >
                {CATEGORIES.map((category) => (
                  <ToggleGroupItem
                    key={category}
                    value={category}
                    aria-label={category}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors
                             data-[state=on]:bg-purple-100 data-[state=on]:text-purple-900
                             hover:bg-gray-100"
                  >
                    {category}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  image={recipe.image}
                  category={recipe.category}
                  source={recipe.source}
                  prepTime={recipe.prepTime}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory !== "הכל"
                    ? "לא נמצאו מתכונים התואמים את החיפוש"
                    : "התחל לייבא מתכונים כדי למלא את ספר המתכונים שלך"}
                </p>
                {!searchTerm && selectedCategory === "הכל" && (
                  <Button
                    variant="outline"
                    onClick={focusImportInput}
                    className="bg-purple-50 text-purple-900 hover:bg-purple-100"
                  >
                    ייבא מתכון ראשון
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
