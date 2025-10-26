import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Create scheduled post
    if (req.method === "POST" && path === "create") {
      const { caption, assetIds, providerTargets, scheduleAt, timezone, contentId } = await req.json();

      // Get workspace
      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership || !["owner", "admin", "publisher", "creator"].includes(membership.role)) {
        throw new Error("Insufficient permissions");
      }

      // Calculate credits to hold (1 credit per target)
      const creditsToHold = providerTargets.length;

      // Hold credits
      const { data: holdSuccess } = await supabase.rpc("hold_credits", {
        p_workspace_id: membership.workspace_id,
        p_amount: creditsToHold,
        p_job_id: null,
        p_description: `Schedule post to ${providerTargets.join(", ")}`,
      });

      if (!holdSuccess) {
        throw new Error("Insufficient credits");
      }

      // Create scheduled post
      const { data: post, error } = await supabase
        .from("scheduled_posts")
        .insert({
          workspace_id: membership.workspace_id,
          content_id: contentId || null,
          asset_ids: assetIds || [],
          provider_targets: providerTargets,
          caption,
          schedule_at: scheduleAt,
          timezone: timezone || "UTC",
          status: "scheduled",
          credits_held: creditsToHold,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(post), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List scheduled posts
    if (req.method === "GET" && path === "list") {
      const status = url.searchParams.get("status");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");

      let query = supabase
        .from("scheduled_posts")
        .select("*")
        .order("schedule_at", { ascending: true });

      if (status) query = query.eq("status", status);
      if (from) query = query.gte("schedule_at", from);
      if (to) query = query.lte("schedule_at", to);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get post detail
    if (req.method === "GET" && path && path !== "list" && path !== "create") {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("id", path)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Publish now
    if (req.method === "POST" && path !== "create") {
      const postId = path;

      // Get membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership || !["owner", "admin", "publisher"].includes(membership.role)) {
        throw new Error("Insufficient permissions");
      }

      // Get post
      const { data: post } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (!post) throw new Error("Post not found");

      // Update status to queued
      await supabase
        .from("scheduled_posts")
        .update({ status: "queued" })
        .eq("id", postId);

      return new Response(JSON.stringify({ success: true, message: "Publishing initiated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid request");
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});