
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  title: string;
  image: string;
  category: string;
  source: string;
  prepTime?: string;
  onClick?: () => void;
}

export function RecipeCard({ title, image, category, source, prepTime, onClick }: RecipeCardProps) {
  return (
    <Card 
      className="recipe-card group cursor-pointer animate-fade-up"
      onClick={onClick}
    >
      <div className="relative h-full">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="recipe-card-image"
          loading="lazy"
        />
        <div className="recipe-card-content">
          <Badge variant="secondary" className="mb-2">
            {category}
          </Badge>
          <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
          <div className="flex items-center justify-between mt-2">
            {prepTime && (
              <p className="text-sm text-gray-200">{prepTime}</p>
            )}
            <p className="text-xs text-gray-300">{source}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
