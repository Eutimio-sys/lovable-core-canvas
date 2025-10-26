import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { workspaceId, prompt, contentType, maxLength, tone } = await req.json();

    // Get workspace membership
    const { data: membership } = await supabaseClient
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'publisher', 'creator'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Estimate credits (1 credit for text generation)
    const creditsEstimated = 1;

    // Check and hold credits
    const { data: holdResult } = await supabaseClient.rpc('hold_credits', {
      p_workspace_id: workspaceId,
      p_amount: creditsEstimated,
      p_job_id: null,
      p_description: `Text generation: ${contentType}`,
    });

    if (!holdResult) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create job record
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        workspace_id: workspaceId,
        job_type: 'text_generation',
        provider: 'gemini',
        status: 'running',
        progress: 0,
        input_params: { prompt, contentType, maxLength, tone },
        credits_estimated: creditsEstimated,
        created_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Generate text using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts: Record<string, string> = {
      post: 'You are a social media content creator. Create engaging, viral-worthy posts with emojis and hashtags.',
      caption: 'You are an Instagram caption writer. Create catchy, emotional captions with relevant hashtags.',
      article: 'You are a professional content writer. Create well-structured articles with headers and key points.',
      script: 'You are a video script writer. Create engaging scripts with scene descriptions and dialogue.',
      email: 'You are an email marketing specialist. Create compelling email content with clear CTAs.',
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[contentType] || 'You are a helpful content creator.' },
          { role: 'user', content: `Create ${contentType} content based on: ${prompt}. ${tone ? `Tone: ${tone}.` : ''} ${maxLength ? `Maximum length: ${maxLength} words.` : ''}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    // Create content record
    const { data: content } = await supabaseClient
      .from('contents')
      .insert({
        workspace_id: workspaceId,
        title: prompt.substring(0, 100),
        content: generatedText,
        content_type: contentType,
        ai_params: { prompt, tone, maxLength },
        created_by: user.id,
      })
      .select()
      .single();

    // Update job as completed
    await supabaseClient
      .from('jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_data: { text: generatedText },
        credits_actual: creditsEstimated,
        content_id: content?.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Finalize credits
    await supabaseClient.rpc('finalize_credits', {
      p_workspace_id: workspaceId,
      p_held_amount: creditsEstimated,
      p_actual_amount: creditsEstimated,
      p_job_id: job.id,
      p_description: `Text generation completed: ${contentType}`,
    });

    // Log audit
    await supabaseClient.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: 'text_generated',
      resource_type: 'content',
      resource_id: content?.id,
      changes: { prompt, contentType },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        contentId: content?.id,
        text: generatedText,
        creditsUsed: creditsEstimated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
