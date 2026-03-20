import { supabase } from '../lib/supabaseClient';

export async function generateIdeas(category, prompt) {
  console.warn("API MUST BE IMPLEMENTED: generateIdeas", { category, prompt });
  // Returning full mock structure to satisfy IDE type checking
  return { 
    ideas: [
      { title: "Placeholder AI Idea", description: "This is still a mock. Waiting for AI Integration.", why_cool: "Needs OpenAI or similar API key" }
    ] 
  };
}

export async function savePromptHistory(category, custom_prompt, ideas_count) {
  const { data, error } = await supabase
    .from('prompt_history')
    .insert([{ category, custom_prompt, ideas_count }]);
    
  if (error) {
    console.error("Error saving prompt history:", error);
    throw error;
  }
  return data;
}

export async function getSavedIdeas() {
  const { data, error } = await supabase
    .from('saved_ideas')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching saved ideas:", error);
    throw error;
  }
  return data || [];
}

export async function saveIdea(ideaData) {
  const { data, error } = await supabase
    .from('saved_ideas')
    .insert([ideaData])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea:", error);
    throw error;
  }
  return data;
}

export async function deleteIdea(ideaId) {
  const { data, error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('id', ideaId); // Assuming 'id' is the primary key
    
  if (error) {
    console.error("Error deleting idea:", error);
    throw error;
  }
  return true;
}
