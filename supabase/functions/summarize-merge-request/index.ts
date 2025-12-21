import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Chapter {
  title: string;
  content: string;
  status: string;
}

interface SummarizeRequest {
  branchName: string;
  authorName: string;
  chapters: Chapter[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { branchName, authorName, chapters }: SummarizeRequest = await req.json();

    if (!chapters || chapters.length === 0) {
      return new Response(
        JSON.stringify({ summary: "No content available to summarize." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Prepare chapter content for analysis
    const chapterSummaries = chapters.map(ch => {
      const plainText = ch.content.replace(/<[^>]*>/g, '').trim();
      const wordCount = plainText ? plainText.split(/\s+/).length : 0;
      return `**${ch.title}** (${wordCount} words, status: ${ch.status}):\n${plainText.slice(0, 500)}${plainText.length > 500 ? '...' : ''}`;
    }).join('\n\n');

    const totalWords = chapters.reduce((acc, ch) => {
      const text = ch.content.replace(/<[^>]*>/g, '').trim();
      return acc + (text ? text.split(/\s+/).length : 0);
    }, 0);

    const systemPrompt = `You are a helpful editorial assistant for a collaborative writing platform. Your job is to provide concise, helpful summaries of proposed story contributions to help editors decide whether to approve merge requests.

Focus on:
- Key plot developments or new story elements
- Character introductions or development
- Writing quality and tone
- How the content might fit with the main story

Keep summaries brief (2-3 sentences) but informative.`;

    const userPrompt = `Summarize this merge request submission:

**Branch:** ${branchName}
**Author:** ${authorName}
**Total Content:** ${chapters.length} chapter(s), ${totalWords} words

${chapterSummaries}

Provide a brief summary highlighting key story elements and editorial considerations.`;

    console.log('Calling Lovable AI for merge request summary...');

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
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';

    console.log('Summary generated successfully');

    return new Response(
      JSON.stringify({ 
        summary,
        stats: {
          chapterCount: chapters.length,
          totalWords
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-merge-request:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
