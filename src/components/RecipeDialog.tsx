
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Recipe } from "@/types/recipe";
import { ExternalLink } from "lucide-react";

interface RecipeDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}

export function RecipeDialog({ recipe, open, onClose }: RecipeDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{recipe.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{recipe.category}</Badge>
            {recipe.prepTime && (
              <Badge variant="outline">{recipe.prepTime}</Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-none relative aspect-[16/9] w-full overflow-hidden rounded-lg mt-4">
          <img
            src={recipe.image || "/placeholder.svg"}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
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

        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-6 pb-4">
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
