import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

async function performWebSearch(query: string): Promise<string> {
  // Layer 1: google-sr
  try {
    const { search } = require('google-sr');
    const srResults = await search({ query });
    if (srResults && srResults.length > 0) {
      const snippets = srResults.slice(0, 3).map((r: any) => r.description || r.title).join('\n');
      if (snippets.trim()) return snippets;
    }
  } catch (e) {
    console.error('google-sr failed', e);
  }

  // Layer 2: googlethis
  try {
    const google = require('googlethis');
    const options = {
      page: 0, 
      safe: false,
      additional_params: { hl: 'en' }
    };
    const gtResults = await google.search(query, options);
    if (gtResults && gtResults.results && gtResults.results.length > 0) {
      const snippets = gtResults.results.slice(0, 3).map((r: any) => r.description).join('\n');
      if (snippets.trim()) return snippets;
    }
  } catch (e) {
    console.error('googlethis failed', e);
  }

  // Layer 3: Serper API
  try {
    if (process.env.SERPER_API_KEY) {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: query })
      });
      const data = await response.json();
      if (data.organic && data.organic.length > 0) {
        const snippets = data.organic.slice(0, 3).map((r: any) => r.snippet).join('\n');
        if (snippets.trim()) return snippets;
      }
    }
  } catch (e) {
    console.error('Serper failed', e);
  }

  // Layer 4: Tavily API
  try {
    if (process.env.TAVILY_API_KEY) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: "basic",
          include_answer: false,
          max_results: 3
        })
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const snippets = data.results.map((r: any) => r.content).join('\n');
        if (snippets.trim()) return snippets;
      }
    }
  } catch (e) {
    console.error('Tavily failed', e);
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const { data: sessionData } = await auth.getSession();
    
    // We only allow authenticated users to use this feature
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, language } = await request.json();

    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Fetch user to check for BYOK
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { encryptedOpenRouterKey: true },
    });

    let apiKey = process.env.OPENROUTER_API_KEY;

    if (user?.encryptedOpenRouterKey) {
      const decrypted = decrypt(user.encryptedOpenRouterKey);
      if (decrypted) {
        apiKey = decrypted;
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenRouter API key configured' }, { status: 500 });
    }

    const searchQuery = `meaning of "${word}" in ${language || 'Nigerian'} language`;
    const searchContext = await performWebSearch(searchQuery);

    let prompt = `
      You are an expert in Nigerian linguistics, dialects, etymology, and street culture.
      The user wants to add or define the Nigerian word: "${word}".
      ${language ? `Specified Language / Dialect: "${language}".` : 'Language: Not specified. Identify all relevant Nigerian languages/dialects where this word has meaning.'}
    `;

    if (searchContext) {
      prompt += `
      Here are live web search results for context:
      ---
      ${searchContext}
      ---
      `;
    }

    prompt += `
      A word in Nigeria can exist in multiple distinct languages/dialects (e.g. Yoruba, Nigerian Pidgin, Igbo, Hausa, Edo, Efik, Tiv, Slang) with different meanings and unique use cases.
      
      Provide up to 3 distinct linguistic senses/definitions of "${word}".
      Crucially, identify any dialectal spelling variations across Nigerian languages (e.g. "Jápá" in Yoruba with tonal markings vs "Japa" in Nigerian Slang; "Ṣákárà" in Yoruba vs "Shakara" in Pidgin).
      
      For each sense, specify:
      1. "dialect": The Nigerian language or dialect (e.g. "Yoruba", "Nigerian Pidgin", "Hausa", "Igbo", "Urban Slang").
      2. "spelling": The exact orthographic spelling in that specific dialect (e.g. "Jápá" for Yoruba, "Japa" for Slang).
      3. "meaning": Concise, accurate definition with cultural nuance.
      4. "examples": An array of 2-3 authentic, conversational Nigerian example sentences illustrating that specific meaning in context.

      Also provide "aliases": An array of all recognized dialectal/orthographic spellings (e.g. ["Jápá", "Japa"]).

      Respond strictly with a valid JSON object matching this schema (no markdown fences):
      {
        "aliases": ["Jápá", "Japa"],
        "senses": [
          {
            "dialect": "Language or Dialect Name",
            "spelling": "Exact dialect spelling",
            "meaning": "Clear definition",
            "examples": ["Authentic example sentence 1", "Authentic example sentence 2"]
          }
        ],
        "meanings": ["Flat meaning 1", "Flat meaning 2"],
        "examples": ["Flat example 1", "Flat example 2"]
      }
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: 'Failed to generate suggestion from AI' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI JSON:", content);
      return NextResponse.json({ error: 'Invalid format from AI' }, { status: 500 });
    }

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
