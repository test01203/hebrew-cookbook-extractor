import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { RecipeEditDialog } from "@/components/RecipeEditDialog";

export default function RecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      const recipes = JSON.parse(savedRecipes);
      const foundRecipe = recipes.find((r: Recipe) => r.id === id);
      if (foundRecipe) {
        setRecipe(foundRecipe);
      }
    }
  }, [id]);

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleSaveEdit = (updatedRecipe: Recipe) => {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      const recipes = JSON.parse(savedRecipes);
      const updatedRecipes = recipes.map((r: Recipe) =>
        r.id === id ? updatedRecipe : r
      );
      localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      setRecipe(updatedRecipe);
      setShowEditDialog(false);
    }
  };

  const handleDelete = () => {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
      const recipes = JSON.parse(savedRecipes);
      const updatedRecipes = recipes.filter((r: Recipe) => r.id !== id);
      localStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      toast({
        title: "המתכון נמחק",
        description: "המתכון הוסר בהצלחה מהאוסף שלך",
      });
      navigate('/');
    }
  };

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
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ChevronRight className="ml-2 h-4 w-4" />
            חזרה לכל המתכונים
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
            >
              <Edit className="ml-2 h-4 w-4" />
              ערוך מתכון
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              מחק מתכון
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{recipe.title}</h1>
            
            {recipe.siteCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.siteCategories.map((cat, index) => (
                  <Badge key={index} variant="outline">{cat}</Badge>
                ))}
              </div>
            )}
            
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

          {recipe.youtubeUrl && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
              <iframe
                src={recipe.youtubeUrl}
                title="סרטון מתכון"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <a 
              href={recipe.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              {recipe.sourceUrl}
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

      {recipe && showEditDialog && (
        <RecipeEditDialog
          recipe={recipe}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleSaveEdit}
        />
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את המתכון?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את המתכון מספר המתכונים שלך.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
