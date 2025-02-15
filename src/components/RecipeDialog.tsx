
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe";

interface RecipeDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}

export function RecipeDialog({ recipe, open, onClose }: RecipeDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{recipe.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{recipe.category}</Badge>
            {recipe.prepTime && (
              <Badge variant="outline">{recipe.prepTime}</Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={recipe.image || "/placeholder.svg"}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>

        <ScrollArea className="h-full mt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">מצרכים:</h3>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-muted-foreground">
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">אופן ההכנה:</h3>
              <ol className="list-decimal list-inside space-y-2">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="text-muted-foreground">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
