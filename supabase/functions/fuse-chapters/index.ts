import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VersionContent {
  author: string;
  branchName: string;
  content: string;
}

interface FuseRequest {
  versions: VersionContent[];
  instructions?: string;
  chapterTitle?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { versions, instructions, chapterTitle } = await req.json() as FuseRequest;

    if (!versions || versions.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 versions are required for fusion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt for AI fusion
    const versionsText = versions.map((v, i) => 
      `=== VERSION ${String.fromCharCode(65 + i)} (by ${v.author}, branch: ${v.branchName}) ===\n${v.content}`
    ).join('\n\n');

    const systemPrompt = `You are an expert creative writing editor specializing in collaborative storytelling. Your task is to intelligently merge multiple versions of the same chapter into a single cohesive piece.

Guidelines:
- Preserve the best elements from each version
- Maintain consistent voice, tone, and style throughout
- Resolve any contradictions gracefully
- Keep the narrative flow smooth and engaging
- Honor each writer's unique contributions where possible
- The final result should read as if written by one author
- Output only the merged chapter content in HTML format (use <p> tags for paragraphs)
- Do not include any meta-commentary or explanations`;

    const userPrompt = `${chapterTitle ? `Chapter: "${chapterTitle}"\n\n` : ''}${versionsText}${instructions ? `\n\nSpecific instructions from the editor:\n${instructions}` : ''}

Please merge these versions into a single, cohesive chapter. Output only the merged content in HTML format.`;

    console.log(`Fusing ${versions.length} versions for chapter: ${chapterTitle || 'Untitled'}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const fusedContent = data.choices?.[0]?.message?.content;

    if (!fusedContent) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fusion completed successfully');

    return new Response(
      JSON.stringify({ 
        fusedContent,
        contributingAuthors: versions.map(v => v.author),
        versionCount: versions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fusion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
