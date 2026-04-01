import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenerateButton({ onClick, onStop, isLoading, hasResults }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (isLoading && onStop) {
      onStop();
    } else if (!isLoading) {
      onClick();
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        "relative overflow-hidden px-8 h-12 text-base font-semibold rounded-xl",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "shadow-lg shadow-primary/20",
        !isLoading && "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
        "transition-all duration-300"
      )}
    >
      {isLoading ? (
        <>
          <X className="w-5 h-5 mr-2" />
          Stop Generation
        </>
      ) : hasResults ? (
        <>
          <RefreshCw className="w-5 h-5 mr-2" />
          Regenerate
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Ideas
        </>
      )}
    </Button>
  );
}
