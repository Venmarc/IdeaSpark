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
    {
      title: "Micro-SaaS Landing Page Builder",
      description: "Drag-and-drop builder that generates a complete landing page from a one-line pitch.",
      why_its_cool: "Lets solo founders ship a polished page in under 10 minutes.",
      estimated_time: "6 weeks",
      difficulty: "Hard"
    },
    {
      title: "Neighborhood Skill Swap Platform",
      description: "Hyperlocal marketplace where people trade skills instead of money — coding for plumbing, etc.",
      why_its_cool: "Builds community while solving real service-access problems.",
      estimated_time: "5 weeks",
      difficulty: "Medium"
    },
    {
      title: "Focus Timer with Ambient Soundscapes",
      description: "Pomodoro timer paired with AI-generated background audio tuned to your task type.",
      why_its_cool: "Science-backed productivity boost with zero app-switching needed.",
      estimated_time: "2 weeks",
      difficulty: "Easy"
    }
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
  let promptUsed = `Category: ${category}`;

  if (useMock) {
    console.log('🔹 Using MOCK ideas (quota safe)');
    await new Promise(resolve => setTimeout(resolve, 1200));
    ideas = [...MOCK_IDEAS.ideas];
  } else {
    promptUsed = `You are an expert creative idea generator.
Respond with **valid JSON only**. No explanations, no markdown, no extra text.

Return EXACTLY 5 different, actionable ideas in this precise structure:

{
  "ideas": [
    {
      "title": "Short, catchy title",
      "description": "1-2 clear sentences describing the idea",
      "why_its_cool": "Why this idea is exciting or useful",
      "estimated_time": "e.g. 2 weeks",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}

Category: ${category}
Optional user details: ${prompt || "None"}

Make the 5 ideas diverse and high-quality.`;

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptUsed }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7
            }
          })
        }
      );

      if (!geminiRes.ok) throw new Error(`Gemini HTTP ${geminiRes.status}`);

      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = JSON.parse(text.trim());
      ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];
    } catch (err) {
      console.error("Gemini error:", err);
      throw new Error("Idea generation failed. Please try again.");
    }
  }

  // Guarantee exactly 5: pad with mocks if AI returned fewer, then slice
  if (ideas.length < 5) {
    const padding = MOCK_IDEAS.ideas.filter(
      m => !ideas.some(i => i.title === m.title)
    );
    ideas = [...ideas, ...padding].slice(0, 5);
  } else {
    ideas = ideas.slice(0, 5);
  }

  const supabase = await createServerSupabaseClient();
  const { data: generation, error } = await supabase
    .from('idea_generations')
    .insert({
      user_id: session.user.id,
      category,
      details: prompt || null,
      prompt_used: promptUsed,
      raw_response: rawResponse
    })
    .select('id')
    .single();

  if (error) {
    console.error("DB insert error:", error);
    // Non-fatal: don't throw — still return the ideas
  }

  revalidatePath('/');

  return {
    ideas,
    generation_id: generation?.id ?? null
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
    .select('id, title, description, category, created_at, why_its_cool, estimated_time, difficulty')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
    
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