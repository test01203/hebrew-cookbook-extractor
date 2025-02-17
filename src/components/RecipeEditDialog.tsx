
import { Recipe } from "@/types/recipe";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecipeEditDialogProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  onSave: (updatedRecipe: Recipe) => void;
}

export function RecipeEditDialog({ recipe, open, onClose, onSave }: RecipeEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      title: recipe.title,
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions.join('\n'),
      image: recipe.image,
      category: recipe.category,
      prepTime: recipe.prepTime || '',
      youtubeUrl: recipe.youtubeUrl || '',
    },
  });

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const updatedRecipe: Recipe = {
        ...recipe,
        title: values.title,
        ingredients: values.ingredients.split('\n').filter(Boolean),
        instructions: values.instructions.split('\n').filter(Boolean),
        image: values.image,
        category: values.category,
        prepTime: values.prepTime,
        youtubeUrl: values.youtubeUrl,
      };
      onSave(updatedRecipe);
      onClose();
      toast({
        title: "המתכון נשמר",
        description: "המתכון עודכן בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת המתכון",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>עריכת מתכון</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כותרת</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מצרכים (שורה חדשה לכל מצרך)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[150px]" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אופן ההכנה (שורה חדשה לכל שלב)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[200px]" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קטגוריה</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>זמן הכנה</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קישור לתמונה</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קישור ליוטיוב (אופציונלי)</FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "שומר..." : "שמור שינויים"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
