import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This worker should be called by a cron job every minute
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role for worker
    );

    console.log("Scheduler worker starting...");

    // Get posts scheduled for the next 2 minutes
    const now = new Date();
    const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000);

    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("schedule_at", twoMinutesLater.toISOString())
      .order("schedule_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    console.log(`Found ${posts?.length || 0} posts to process`);

    const results = [];

    for (const post of posts || []) {
      try {
        console.log(`Processing post ${post.id}`);

        // Update status to publishing
        await supabase
          .from("scheduled_posts")
          .update({ status: "publishing" })
          .eq("id", post.id);

        // Simulate publishing to each provider target
        const publishResults = [];
        let successCount = 0;

        for (const provider of post.provider_targets) {
          // Simulate API call to provider
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock publish result (90% success rate)
          const success = Math.random() > 0.1;
          
          if (success) {
            publishResults.push({
              provider,
              success: true,
              publishId: `${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              url: `https://${provider}.com/posts/${post.id}`,
              timestamp: new Date().toISOString(),
            });
            successCount++;
          } else {
            publishResults.push({
              provider,
              success: false,
              error: "Mock API error - rate limit exceeded",
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Calculate actual credits (1 per successful publish)
        const creditsActual = successCount;

        // Update post with results
        const finalStatus = successCount === post.provider_targets.length 
          ? "published" 
          : successCount > 0 
          ? "published" // Partial success still marked as published
          : "failed";

        await supabase
          .from("scheduled_posts")
          .update({
            status: finalStatus,
            results: publishResults,
            credits_actual: creditsActual,
            error_message: successCount === 0 ? "All publishes failed" : null,
          })
          .eq("id", post.id);

        // Finalize credits
        await supabase.rpc("finalize_credits", {
          p_workspace_id: post.workspace_id,
          p_held_amount: post.credits_held || 0,
          p_actual_amount: creditsActual,
          p_job_id: null,
          p_description: `Published to ${successCount}/${post.provider_targets.length} targets`,
        });

        // Send notification
        await supabase.from("notifications").insert({
          workspace_id: post.workspace_id,
          user_id: post.created_by,
          type: finalStatus === "published" ? "publish_success" : "publish_failed",
          title: finalStatus === "published" ? "Post Published" : "Publish Failed",
          message: finalStatus === "published"
            ? `Successfully published to ${successCount} platform(s)`
            : `Failed to publish to all platforms`,
          payload: { postId: post.id, results: publishResults },
        });

        results.push({ postId: post.id, status: finalStatus, successCount });

        console.log(`Completed post ${post.id}: ${finalStatus}`);
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        
        // Mark as failed
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", post.id);

        results.push({ postId: post.id, status: "failed", error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scheduler worker error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});