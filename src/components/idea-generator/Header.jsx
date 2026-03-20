import React from "react";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        AI-Powered Idea Generator
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        What will you create{" "}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          today?
        </span>
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
        Pick a category, add optional details, and let AI craft fresh ideas for you.
      </p>
    </div>
  );
}
