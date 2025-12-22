import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConflictBlock {
  id: string;
  type: 'conflict' | 'added-a' | 'added-b';
  contentA?: string;
  contentB?: string;
  similarity?: number;
}

interface ConflictAnalysis {
  blockId: string;
  classification: 'style' | 'addition' | 'rewrite' | 'minor';
  recommendation: 'a' | 'b' | 'both' | 'manual';
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conflicts, versionAName, versionBName } = await req.json();
    
    if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0) {
      return new Response(JSON.stringify({ analyses: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build prompt for AI analysis
    const conflictDescriptions = conflicts.map((c: ConflictBlock, i: number) => {
      if (c.type === 'conflict') {
        return `Conflict ${i + 1} (ID: ${c.id}, similarity: ${Math.round((c.similarity || 0) * 100)}%):
Version A (${versionAName}): "${c.contentA?.substring(0, 500)}${(c.contentA?.length || 0) > 500 ? '...' : ''}"
Version B (${versionBName}): "${c.contentB?.substring(0, 500)}${(c.contentB?.length || 0) > 500 ? '...' : ''}"`;
      } else {
        const content = c.type === 'added-a' ? c.contentA : c.contentB;
        const version = c.type === 'added-a' ? versionAName : versionBName;
        return `Addition ${i + 1} (ID: ${c.id}, from ${version}):
"${content?.substring(0, 500)}${(content?.length || 0) > 500 ? '...' : ''}"`;
      }
    }).join('\n\n');

    const systemPrompt = `You are an expert editor analyzing text conflicts for a collaborative writing merge tool. 
Your job is to classify each conflict and recommend which version to use.

For each conflict/addition, provide:
1. classification: One of "style" (same meaning, different wording), "addition" (new content), "rewrite" (substantially different content), or "minor" (punctuation, formatting, typos)
2. recommendation: "a" (use version A), "b" (use version B), "both" (include both), or "manual" (needs human review)
3. confidence: A number 0-1 indicating how confident you are
4. reason: A brief 1-sentence explanation

Focus on narrative consistency, writing quality, and content completeness.
Return a JSON array of analyses.`;

    const userPrompt = `Analyze these conflicts and provide recommendations:

${conflictDescriptions}

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[{"blockId": "...", "classification": "...", "recommendation": "...", "confidence": 0.X, "reason": "..."}]`;

    console.log(`Analyzing ${conflicts.length} conflicts with AI`);

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
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content.substring(0, 200));

    // Parse the JSON response
    let analyses: ConflictAnalysis[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        analyses = JSON.parse(jsonMatch[0]);
      } else {
        analyses = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return empty analyses if parsing fails
      return new Response(JSON.stringify({ analyses: [], parseError: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize analyses
    analyses = analyses.map((a: any) => ({
      blockId: String(a.blockId || ''),
      classification: ['style', 'addition', 'rewrite', 'minor'].includes(a.classification) ? a.classification : 'rewrite',
      recommendation: ['a', 'b', 'both', 'manual'].includes(a.recommendation) ? a.recommendation : 'manual',
      confidence: typeof a.confidence === 'number' ? Math.max(0, Math.min(1, a.confidence)) : 0.5,
      reason: String(a.reason || 'No reason provided').substring(0, 200),
    }));

    console.log(`Successfully analyzed ${analyses.length} conflicts`);

    return new Response(JSON.stringify({ analyses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-conflicts:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
