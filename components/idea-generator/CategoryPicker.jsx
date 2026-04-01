import React from "react";
import { cn } from "@/lib/utils";
import { 
  Lightbulb, BookOpen, Gift, Dumbbell, Heart, 
  Palette, Code, Music, Utensils, Sparkles 
} from "lucide-react";

const categories = [
  { id: "startup", label: "Startup", icon: Lightbulb, color: "text-amber-500" },
  { id: "story", label: "Story Plot", icon: BookOpen, color: "text-violet-500" },
  { id: "gift", label: "Gift Ideas", icon: Gift, color: "text-rose-500" },
  { id: "workout", label: "Workout", icon: Dumbbell, color: "text-emerald-500" },
  { id: "date_night", label: "Date Night", icon: Heart, color: "text-pink-500" },
  { id: "creative", label: "Creative Project", icon: Palette, color: "text-sky-500" },
  { id: "side_project", label: "Side Project", icon: Code, color: "text-indigo-500" },
  { id: "playlist", label: "Playlist Theme", icon: Music, color: "text-orange-500" },
  { id: "recipe", label: "Recipe", icon: Utensils, color: "text-teal-500" },
  { id: "surprise", label: "Surprise Me", icon: Sparkles, color: "text-primary" },
];

export default function CategoryPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-xl p-4 transition-all duration-200",
              "border hover:shadow-lg hover:-translate-y-1 hover:scale-105 active:scale-95",
              isActive
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", cat.color)} />
            <span className={cn(
              "text-xs font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {cat.label}
            </span>
            {isActive && (
              <div className="absolute -top-px -left-px -right-px h-0.5 bg-primary rounded-t-xl" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { categories };
