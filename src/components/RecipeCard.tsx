
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface RecipeCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  source: string;
  prepTime?: string;
}

export function RecipeCard({ id, title, image, category, source, prepTime }: RecipeCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="recipe-card group cursor-pointer animate-fade-up"
      onClick={() => navigate(`/recipe/${id}`)}
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
