"use server";

import { getServerSession } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MOCK_IDEAS = {
  ideas: [
    { title: "AI Meal Planner", description: "App that scans your fridge and suggests quick family meals.", why_its_cool: "Saves hours every week and reduces waste.", estimated_time: "3 weeks", difficulty: "Medium" },
    { title: "Gamified Fitness Quest", description: "Workout app where your real-life exercise powers a fantasy RPG character.", why_its_cool: "Adds engaging progression to daily workouts.", estimated_time: "4 weeks", difficulty: "Medium" },
    { title: "Local Skill-Swap Platform", description: "Community board connecting people who want to trade skills.", why_its_cool: "Fosters real-world connections without money.", estimated_time: "3 weeks", difficulty: "Low" },
    { title: "Automated Plant Care Monitor", description: "IoT soil sensor paired with a mobile app that texts you.", why_its_cool: "Prevents plant death with simple actionable alerts.", estimated_time: "5 weeks", difficulty: "High" },
    { title: "Niche Newsletter Generator", description: "Tool aggregating hyper-specific daily news feeds.", why_its_cool: "Cuts through the noise to deliver exactly what the user cares about.", estimated_time: "2 weeks", difficulty: "Low" }
  ]
};

export async function generateIdeas(category: string, prompt: string = "") {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const useMock = process.env.MOCK_AI === 'true';

  let ideas: any[] = [];
  let rawResponse: any = {};
  let systemPrompt = `Category: ${category}`;

  if (useMock) {
    console.log('🔹 Using MOCK ideas (quota safe)');
    await new Promise(resolve => setTimeout(resolve, 1200));
    ideas = MOCK_IDEAS.ideas;
    rawResponse = { source: "mock" };
  } else {
    systemPrompt = `You are a creative idea generator. 
Always respond with valid JSON only. 
Return EXACTLY 5 distinct, actionable ideas in this exact structure:
{
  "ideas": [
    {
      "title": "Short catchy title",
      "description": "1-2 sentence clear description",
      "why_its_cool": "Why this idea is exciting or useful",
      "estimated_time": "Time to build MVP (e.g. 2 weeks)",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}
Category: ${category}
Additional user details: ${prompt || "None"}`;

    try {
      // Gemini primary
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.8 
          }
        })
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(text.trim());
        ideas = parsed.ideas || [];
        rawResponse = { source: "gemini", raw: text };
      } else {
        throw new Error("Gemini failed");
      }
    } catch (err) {
      console.error("Gemini failed, trying OpenAI fallback");
      // TODO: Add your OpenAI fallback here (use openai SDK or fetch)
      throw new Error("AI generation failed. Please try again.");
    }
  }

  // Save the generation record
  const supabase = await createServerSupabaseClient();
  const { data: generation, error } = await supabase
    .from('idea_generations')
    .insert({
      category,
      details: prompt || null,
      prompt_used: systemPrompt,
      raw_response: rawResponse
    })
    .select('id')
    .single();

  if (error) throw error;

  revalidatePath('/');

  return {
    ideas: ideas.slice(0, 5), // enforce exactly 5
    generation_id: generation.id
  };
}

export async function saveIdeaGeneration(category: string, prompt: string, raw_response: any = null) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('idea_generations')
    .insert([{ user_id: user.id, category, prompt_used: prompt, raw_response }])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea generation:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function getSavedIdeas() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_ideas')
    .select('*')
    // We already enforce RLS but it's good practice.
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching saved ideas:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function saveIdea(ideaData: any) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('saved_ideas')
    .insert([{ ...ideaData, user_id: user.id }])
    .select()
    .single();
    
  if (error) {
    console.error("Error saving idea:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteIdea(ideaId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('saved_ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', user.id); // extra safety
    
  if (error) {
    console.error("Error deleting idea:", error);
    throw new Error(error.message);
  }
  return true;
}
