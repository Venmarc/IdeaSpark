import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function IdeaCard({ idea, index, onSave, isSaved }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${idea.title}\n${idea.description}\n${idea.why_cool}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="group relative overflow-hidden border-border/60 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent opacity-60" />
        <div className="p-5 pl-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <h3 className="font-semibold text-foreground text-base leading-tight">
                {idea.title}
              </h3>
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isSaved ? "text-primary" : "text-muted-foreground hover:text-primary")}
                onClick={() => onSave(idea)}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 pl-10">
            {idea.description}
          </p>
          <div className="pl-10 flex items-start gap-2 text-xs">
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
              Why it's cool
            </span>
            <span className="text-muted-foreground leading-relaxed">{idea.why_cool}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
