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

    // Mock text generation (replace with real AI API call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const templates: Record<string, string> = {
      post: `🚀 Exciting news! ${prompt}\n\nWhat do you think? Drop a comment below! 👇\n\n#innovation #ai #content`,
      caption: `✨ ${prompt}\n\n📸 Making memories one moment at a time\n\n#lifestyle #inspiration`,
      article: `# ${prompt}\n\n## Introduction\n\nIn today's digital landscape, content creation has evolved dramatically...\n\n## Key Points\n\n1. Innovation drives success\n2. Quality matters\n3. Authenticity builds trust`,
      script: `[SCENE 1]\n\n"${prompt}"\n\n[Visual: Dynamic intro]\n\n[SCENE 2]\n\n...`,
      email: `Subject: ${prompt}\n\nHi there,\n\nWe're excited to share...\n\nBest regards,\nYour Team`,
    };

    const generatedText = templates[contentType] || `Generated: ${prompt}`;

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
