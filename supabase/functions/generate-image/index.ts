import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { workspaceId, prompt, width, height, style } = await req.json();

    // Check permissions
    const { data: membership } = await supabaseClient
      .from('memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin', 'publisher', 'creator'].includes(membership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Calculate credits based on resolution
    const pixelCount = width * height;
    const creditsEstimated = pixelCount > 1000000 ? 10 : pixelCount > 500000 ? 5 : 3;

    // Hold credits
    const { data: holdResult } = await supabaseClient.rpc('hold_credits', {
      p_workspace_id: workspaceId,
      p_amount: creditsEstimated,
      p_job_id: null,
      p_description: `Image generation: ${width}x${height}`,
    });

    if (!holdResult) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create job
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        workspace_id: workspaceId,
        job_type: 'image_generation',
        provider: 'stability',
        status: 'running',
        progress: 0,
        input_params: { prompt, width, height, style },
        credits_estimated: creditsEstimated,
        created_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Mock image generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    const mockImageUrl = `https://images.unsplash.com/photo-1557683316-973673baf926?w=${width}&h=${height}&fit=crop`;

    // Create asset record
    const { data: asset } = await supabaseClient
      .from('assets')
      .insert({
        workspace_id: workspaceId,
        name: prompt.substring(0, 50) + '.jpg',
        asset_type: 'image',
        mime_type: 'image/jpeg',
        width,
        height,
        storage_url: mockImageUrl,
        cdn_url: mockImageUrl,
        provider: 'stability',
        ai_params: { prompt, style },
        created_by: user.id,
      })
      .select()
      .single();

    // Update job
    await supabaseClient
      .from('jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_data: { url: mockImageUrl, width, height },
        credits_actual: creditsEstimated,
        asset_id: asset?.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Finalize credits
    await supabaseClient.rpc('finalize_credits', {
      p_workspace_id: workspaceId,
      p_held_amount: creditsEstimated,
      p_actual_amount: creditsEstimated,
      p_job_id: job.id,
      p_description: `Image generation completed: ${width}x${height}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        assetId: asset?.id,
        url: mockImageUrl,
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
