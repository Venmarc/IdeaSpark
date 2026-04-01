"use client";

import React, { useState } from "react";
import {
  generateIdeas as generateIdeasAction,
  getSavedIdeas,
  saveIdea,
  deleteIdea,
} from "@/app/actions";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

import Header from "@/components/idea-generator/Header";
import CategoryPicker, { categories } from "@/components/idea-generator/CategoryPicker";
import PromptInput from "@/components/idea-generator/PromptInput";
import GenerateButton from "@/components/idea-generator/GenerateButton";
import IdeaCard from "@/components/idea-generator/IdeaCard";
import LoadingSkeleton from "@/components/idea-generator/LoadingSkeleton";
import SavedIdeasDrawer from "@/components/idea-generator/SavedIdeasDrawer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("startup");
  const [customPrompt, setCustomPrompt] = useState("");
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<number | null>(null);
  const generationRef = React.useRef(0); // For canceling/ignoring old requests
  const queryClient = useQueryClient();

  const { data: savedIdeas = [], isLoading: loadingSaved } = useQuery({
    queryKey: ["saved-ideas"],
    queryFn: () => getSavedIdeas(),
  });

  const savedTitles = new Set(savedIdeas.map((i: any) => i.title));

  const handleGenerateIdeas = async (category: string, prompt: string) => {
    const attemptId = ++generationRef.current;
    setIsGenerating(true);
    setIdeas([]);

    const categoryLabel = categories.find((c) => c.id === category)?.label || category;

    try {
      const result = await generateIdeasAction(categoryLabel, prompt);
      
      // If user clicked "Stop", attemptId will no longer match generationRef.current
      if (attemptId !== generationRef.current) return;

      setIdeas(result.ideas || []);
      setCurrentGenerationId(result.generation_id ?? null);
    } catch (error: any) {
      if (attemptId !== generationRef.current) return;
      console.error(error);
      toast.error(error.message || "Failed to generate ideas");
      setIdeas([]);
    } finally {
      if (attemptId === generationRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleStop = () => {
    generationRef.current++; // Invalidate pending request
    setIsGenerating(false);
    toast.info("Generation stopped");
  };

  const handleGenerate = () => {
    handleGenerateIdeas(selectedCategory, customPrompt);
  };

  const handleSurpriseMe = () => {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    setSelectedCategory(randomCat.id);
    setCustomPrompt("");
    handleGenerateIdeas(randomCat.id, "");
  };

  const saveIdeaMutation = useMutation({
    mutationFn: (ideaData: any) => saveIdea(ideaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ideas"] });
      toast.success("Idea saved!");
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: (id: number) => deleteIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ideas"] });
      toast.success("Idea removed");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">I</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">IdeaSpark</span>
          </div>
          <SavedIdeasDrawer
            savedIdeas={savedIdeas}
            onDelete={(id: number) => deleteIdeaMutation.mutate(id)}
            isLoading={loadingSaved}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <Header />

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Choose a category
            </label>
            <CategoryPicker selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          <PromptInput
            value={customPrompt}
            onChange={setCustomPrompt}
            category={selectedCategory}
          />

          <div className="flex items-center gap-3">
            <GenerateButton
              onClick={handleGenerate}
              onStop={handleStop}
              isLoading={isGenerating}
              hasResults={ideas.length > 0}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={handleSurpriseMe}
              disabled={isGenerating}
              className="h-12 rounded-xl gap-2 border-border/60"
            >
              <Shuffle className="w-4 h-4" />
              Surprise Me
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : ideas.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Your Ideas
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {ideas.map((idea, i) => (
                <IdeaCard
                  key={idea.title + i}
                  idea={idea}
                  index={i}
                  onSave={(item: any) => saveIdeaMutation.mutate({
                    ...item,
                    category: categories.find((c) => c.id === selectedCategory)?.label || selectedCategory,
                    prompt_used: customPrompt,
                    generation_id: currentGenerationId,
                  })}
                  isSaved={savedTitles.has(idea.title)}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
