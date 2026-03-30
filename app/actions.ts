"use server";

import { createServerSupabaseClient } from "@/lib/supabase";

function cleanJson(str: string) {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function generateIdeas(category: string, prompt: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

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
