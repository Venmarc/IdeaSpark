"use server";

import { getServerSession } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MOCK_IDEAS = {
  ideas: [
    {
      title: "AI Meal Planner for Busy Parents",
      description: "App that scans fridge photos and suggests quick healthy dinners with shopping lists.",
      why_its_cool: "Saves 5+ hours per week and cuts food waste dramatically.",
      estimated_time: "3 weeks to MVP",
      difficulty: "Medium"
    },
    {
      title: "Night Shift Workout App",
      description: "15-minute workouts designed for irregular sleep schedules with recovery tracking.",
      why_its_cool: "Makes fitness realistic for people with weird hours.",
      estimated_time: "4 weeks",
      difficulty: "Medium"
    },
    // Add 3 more varied, high-quality mocks here (different categories)
  ]
};

export async function generateIdeas(category: string, prompt: string = ""): Promise<{ ideas: any[]; generation_id: any }> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const useMock = process.env.MOCK_AI === 'true';

  let ideas: any[] = [];
  let rawResponse: any = { source: useMock ? "mock" : "ai" };

  if (useMock) {
    console.log('🔹 Using MOCK ideas (quota safe)');
    await new Promise(resolve => setTimeout(resolve, 1200));
    ideas = [...MOCK_IDEAS.ideas];
  } else {
    const systemPrompt = `You are a creative idea generator. Respond with valid JSON only. No extra text.

Return EXACTLY 5 ideas in this exact structure:
{
  "ideas": [
    {
      "title": "Short catchy title",
      "description": "1-2 sentence clear description",
      "why_its_cool": "Why this idea is exciting or useful",
      "estimated_time": "e.g. 2 weeks",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}

Category: ${category}
User details: ${prompt || "None"}`;

    try {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.75 }
        })
      });

      if (!geminiRes.ok) throw new Error("Gemini failed");

      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = JSON.parse(text.trim());
      ideas = parsed.ideas || [];
    } catch (err) {
      console.error("Gemini error:", err);
      throw new Error("Idea generation failed. Try again.");
    }
  }

  const supabase = await createServerSupabaseClient();
  const { data: generation, error } = await supabase
    .from('idea_generations')
    .insert({
      category,
      details: prompt || null,
      prompt_used: `Category: ${category}`,
      raw_response: rawResponse
    })
    .select('id')
    .single();

  if (error) throw error;

  revalidatePath('/');

  return {
    ideas: ideas.slice(0, 5),
    generation_id: generation.id
  };
}

export async function saveIdeaGeneration(category: string, prompt: string, raw_response: any = null) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('idea_generations')
    .insert([{ 
      user_id: session.user.id, 
      category, 
      details: prompt, 
      prompt_used: `Category: ${category}`,
      raw_response 
    }])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea generation:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function getSavedIdeas() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching saved ideas:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function saveIdea(ideaData: any) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('saved_ideas')
    .insert([{ ...ideaData, user_id: session.user.id }])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea:", error);
    throw new Error(error.message);
  }
  
  revalidatePath('/');
  return data;
}

export async function deleteIdea(ideaId: number) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', session.user.id);
    
  if (error) {
    console.error("Error deleting idea:", error);
    throw new Error(error.message);
  }
  
  revalidatePath('/');
  return true;
}