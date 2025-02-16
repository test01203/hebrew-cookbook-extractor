
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink } from "lucide-react";

export default function RecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    // Get recipes from localStorage
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      const recipes = JSON.parse(savedRecipes);
      const foundRecipe = recipes.find((r: Recipe) => r.id === id);
      setRecipe(foundRecipe);
    }
  }, [id]);

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">המתכון לא נמצא</p>
        <Button variant="link" onClick={() => navigate('/')}>
          חזרה לדף הראשי
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ChevronRight className="ml-2 h-4 w-4" />
          חזרה לכל המתכונים
        </Button>

        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{recipe.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{recipe.category}</Badge>
              {recipe.prepTime && (
                <Badge variant="outline">{recipe.prepTime}</Badge>
              )}
            </div>
          </div>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
            <img
              src={recipe.image || "/placeholder.svg"}
              alt={recipe.title}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>מקור:</span>
            <a 
              href={recipe.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              {recipe.source}
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">מצרכים</h2>
              <ul className="list-disc list-inside space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-muted-foreground mr-4">
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">אופן ההכנה</h2>
              <ol className="list-decimal list-inside space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="text-muted-foreground">
                    <span className="mr-2">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
