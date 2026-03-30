import React from "react";
import { Textarea } from "@/components/ui/textarea";

export default function PromptInput({ value, onChange, category }) {
  const placeholders = {
    startup: "e.g., SaaS for pet owners, AI tool for teachers...",
    story: "e.g., sci-fi romance, detective in a fantasy world...",
    gift: "e.g., for a 30-year-old who loves hiking...",
    workout: "e.g., 20-min home workout, no equipment...",
    date_night: "e.g., budget-friendly, outdoorsy couple...",
    creative: "e.g., weekend art project with kids...",
    side_project: "e.g., weekend coding project, beginner-friendly...",
    playlist: "e.g., chill lo-fi for studying, road trip energy...",
    recipe: "e.g., quick dinner, vegetarian, under 30 min...",
    surprise: "Tell me anything, or leave blank for total surprise...",
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Add details <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholders[category] || "Describe what you're looking for..."}
        className="resize-none h-20 bg-background border-border/60 focus:border-primary/40 transition-colors text-sm"
      />
    </div>
  );
}
