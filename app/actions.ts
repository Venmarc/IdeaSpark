"use server";

import { createServerSupabaseClient } from "@/lib/supabase";

function cleanJson(str: string) {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

const MOCK_IDEAS = {
  ideas: [
    {
      title: "AI-Powered Meal Planner for Busy Parents",
      description: "App that scans fridge photos and suggests 30-min family dinners with shopping list.",
      why_its_cool: "Saves 5+ hours/week on planning and reduces food waste by 40%.",
      estimated_time: "2 weeks to MVP",
      difficulty: "Medium"
    },
    {
      title: "Gamified Fitness Quest",
      description: "Workout app where your real-life exercise powers a fantasy RPG character.",
      why_its_cool: "Adds engaging progression and storytelling to daily workouts.",
      estimated_time: "4 weeks to MVP",
      difficulty: "Medium"
    },
    {
      title: "Local Skill-Swap Platform",
      description: "Community board connecting people who want to trade skills (e.g., coding for guitar lessons).",
      why_its_cool: "Fosters real-world connections and accessible education without money.",
      estimated_time: "3 weeks to MVP",
      difficulty: "Low"
    },
    {
      title: "Automated Plant Care Monitor",
      description: "IoT soil sensor paired with a mobile app that texts you when plants need water.",
      why_its_cool: "Prevents plant death with simple, actionable alerts before it's too late.",
      estimated_time: "5 weeks to MVP",
      difficulty: "High"
    },
    {
      title: "Niche Newsletter Generator",
      description: "Tool aggregating hyper-specific daily news feeds based on 5 user-selected keywords.",
      why_its_cool: "Cuts through the noise to deliver exactly what the user cares about.",
      estimated_time: "2 weeks to MVP",
      difficulty: "Low"
    }
  ]
};

export async function generateIdeas(category: string, prompt: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const useMock = process.env.MOCK_AI === 'true';

  if (useMock) {
    console.log('🔹 Using MOCK ideas (quota safe)');
    // Small delay to simulate network
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { ideas: MOCK_IDEAS.ideas };
  }

  const systemMessage = `Return exactly 5 ideas in JSON format. The JSON must have exactly this structure: {"ideas": [{"title": "Title here", "description": "Description here", "why_its_cool": "Reason here"}]}. The requested category is: ${category}. User prompt (optional): ${prompt}`;

  // 1. Try Gemini primary
  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemMessage }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(cleanJson(text));
    } else {
      console.warn("Gemini generation failed, falling back to OpenAI.", await geminiRes.text());
    }
  } catch (err) {
    console.error("Gemini fetch error, falling back to OpenAI.", err);
  }

  // 2. Fallback to OpenAI
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: systemMessage }]
      })
    });

    if (openaiRes.ok) {
      const oaiData = await openaiRes.json();
      return JSON.parse(cleanJson(oaiData.choices[0].message.content));
    } else {
      console.error("OpenAI fallback failed.", await openaiRes.text());
      throw new Error("Both Gemini and OpenAI failed to generate ideas.");
    }
  } catch (err) {
    console.error("OpenAI fetch error.", err);
    throw new Error("Both AI models failed.");
  }
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
