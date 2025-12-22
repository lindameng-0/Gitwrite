import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MergePlanRequest {
  sourceContent: string;
  targetContent: string;
  sourceAuthor: string;
  targetAuthor: string;
  sourceBranch: string;
  targetBranch: string;
  chapterTitle?: string;
}

interface MergePlanSection {
  id: string;
  type: 'keep_source' | 'keep_target' | 'merge' | 'conflict';
  sourceText?: string;
  targetText?: string;
  recommendation: 'source' | 'target' | 'merge';
  reason: string;
  suggestedContent?: string;
  confidence: number;
}

interface MergePlan {
  sections: MergePlanSection[];
  summary: string;
  overallRecommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sourceContent, 
      targetContent, 
      sourceAuthor, 
      targetAuthor,
      sourceBranch,
      targetBranch,
      chapterTitle 
    } = await req.json() as MergePlanRequest;

    if (!sourceContent || !targetContent) {
      return new Response(
        JSON.stringify({ error: 'Both source and target content are required' }),
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

    const systemPrompt = `You are an expert editor analyzing two versions of a story chapter to create a detailed merge plan. Your task is to:

1. Compare both versions paragraph by paragraph
2. Identify what's unique, what's similar, and what conflicts
3. Provide clear recommendations for each section with reasons
4. Suggest merged content where appropriate

Output a JSON object with this exact structure:
{
  "sections": [
    {
      "id": "section_1",
      "type": "keep_source" | "keep_target" | "merge" | "conflict",
      "sourceText": "text from source version (if applicable)",
      "targetText": "text from target version (if applicable)",
      "recommendation": "source" | "target" | "merge",
      "reason": "Brief explanation for this recommendation",
      "suggestedContent": "Merged text if type is 'merge' or 'conflict'",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "Brief overview of the merge plan",
  "overallRecommendation": "High-level recommendation for the editor"
}

Guidelines:
- Be specific about what makes each version valuable
- Consider narrative flow, character consistency, and writing quality
- For conflicts, always provide a suggested merged version
- Confidence should reflect how certain you are about the recommendation
- Keep reasons concise but informative`;

    const userPrompt = `${chapterTitle ? `Chapter: "${chapterTitle}"\n\n` : ''}
=== SOURCE VERSION (by ${sourceAuthor}, branch: ${sourceBranch}) ===
${sourceContent}

=== TARGET VERSION (by ${targetAuthor}, branch: ${targetBranch}) ===
${targetContent}

Analyze these versions and create a detailed merge plan. Output only valid JSON.`;

    console.log(`Generating merge plan for chapter: ${chapterTitle || 'Untitled'}`);

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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
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
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    try {
      // Clean up the content if it has markdown code blocks
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const mergePlan: MergePlan = JSON.parse(content);
      
      console.log('Merge plan generated successfully with', mergePlan.sections?.length || 0, 'sections');

      return new Response(
        JSON.stringify({ mergePlan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse merge plan', rawContent: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Merge plan generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
