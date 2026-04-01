import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenerateButton({ onClick, isLoading, hasResults }) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="lg"
      className={cn(
        "relative overflow-hidden px-8 h-12 text-base font-semibold rounded-xl",
        "bg-primary hover:bg-primary/90 text-white",
        "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5",
        "transition-all duration-300"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Generating...
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
