
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

  const handleBulkImport = (importedRecipes: Omit<Recipe, "id">[]) => {
    const newRecipes = importedRecipes.map(recipe => ({
      ...recipe,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));
    
    setRecipes(prev => [...prev, ...newRecipes]);
    toast({
      title: "המתכונים נוספו בהצלחה",
      description: `${newRecipes.length} מתכונים נוספו לספר המתכונים שלך`,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-purple-100 py-20">
        <div className="w-full max-w-3xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">נמאס לך ממתכונים מפוזרים?</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              צור מאגר של כל המתכונים האהובים עליך ממגוון אתרים בקלות ובמקום אחד
            </p>
          </div>

          <div className="grid gap-4 max-w-lg mx-auto">
            <RecipeImporter onImport={handleImport} />
            <div className="text-center">
              <span className="text-gray-500">או</span>
            </div>
            <RecipeSourceImporter onImport={handleBulkImport} />
          </div>

          <div className="mt-16 bg-white rounded-xl shadow-lg p-8 space-y-8">
            <h2 className="text-2xl font-bold text-center text-gray-900">יותר מסתם ספר מתכונים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">חיפוש מהיר</h3>
                <p className="text-sm text-gray-600">מצא את המתכונים שלך בקלות ובמהירות</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">ייבוא אוטומטי</h3>
                <p className="text-sm text-gray-600">ייבא מתכונים מכל האתרים האהובים עליך</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">ארגון קטגוריות</h3>
                <p className="text-sm text-gray-600">סדר את המתכונים שלך בקטגוריות נוחות</p>
              </div>
            </div>
          </div>
        </div>

        {recipes.length > 0 && (
          <div className="w-full max-w-7xl mx-auto mt-12 px-4">
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
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    image={recipe.image}
                    category={recipe.category}
                    source={recipe.source}
                    prepTime={recipe.prepTime}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {recipes.length === 0 && !searchTerm && selectedCategory === "הכל" && (
          <div className="w-full max-w-7xl mx-auto mt-12 px-4">
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 mb-4">
                התחל לייבא מתכונים כדי למלא את ספר המתכונים שלך
              </p>
              <Button
                variant="outline"
                onClick={focusImportInput}
                className="bg-purple-50 text-purple-900 hover:bg-purple-100"
              >
                ייבא מתכון ראשון
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
