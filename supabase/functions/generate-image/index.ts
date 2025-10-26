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

    // Generate image using Lovable AI (Nano banana model)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const stylePrompt = style ? `Style: ${style}. ` : '';
    const fullPrompt = `${stylePrompt}${prompt}. Aspect ratio: ${width}x${height}. Ultra high resolution.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`Image generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const base64Image = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64Image) {
      throw new Error('No image returned from AI');
    }

    // Upload to Supabase Storage
    const imageBuffer = Uint8Array.from(atob(base64Image.split(',')[1]), c => c.charCodeAt(0));
    const fileName = `${workspaceId}/${Date.now()}-${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-')}.png`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('assets')
      .getPublicUrl(fileName);

    const mockImageUrl = publicUrl;

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
