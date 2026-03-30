"use server";

import { createClient } from "@/utils/supabase/server";

export async function generateIdeas(category: string, prompt: string) {
  console.warn("API MUST BE IMPLEMENTED: generateIdeas", { category, prompt });
  // Returning full mock structure to satisfy IDE type checking
  return { 
    ideas: [
      { title: "Placeholder AI Idea", description: "This is a mock from Server Action. Waiting for AI Integration.", why_cool: "Needs OpenAI or similar API key" }
    ] 
  };
}

export async function saveIdeaGeneration(category: string, prompt: string, raw_response: any = null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('idea_generations')
    .insert([{ category, prompt_used: prompt, raw_response }])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea generation:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function getSavedIdeas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching saved ideas:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function saveIdea(ideaData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .insert([ideaData])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteIdea(ideaId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('id', ideaId);
    
  if (error) {
    console.error("Error deleting idea:", error);
    throw new Error(error.message);
  }
  return true;
}
