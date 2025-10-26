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
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Connect channel (mock OAuth)
    if (req.method === "POST" && action === "connect") {
      const { provider } = await req.json();

      // Get workspace
      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new Error("Insufficient permissions");
      }

      // Mock OAuth - simulate account connection
      const mockAccounts: Record<string, any> = {
        facebook_ig: { accountName: "@mybrand_official", accountId: "fb_12345" },
        x: { accountName: "@mybrand", accountId: "x_67890" },
        linkedin: { accountName: "MyBrand Company", accountId: "li_54321" },
        tiktok: { accountName: "@mybrand_tt", accountId: "tt_98765" },
      };

      const accountData = mockAccounts[provider] || {
        accountName: `@${provider}_account`,
        accountId: `${provider}_${Date.now()}`,
      };

      // Create channel
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .insert({
          workspace_id: membership.workspace_id,
          provider,
          account_name: accountData.accountName,
          account_id: accountData.accountId,
          status: "active",
          scopes: ["publish", "read"],
          created_by: user.id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Create mock token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 60 days

      await supabase.from("channel_tokens").insert({
        workspace_id: membership.workspace_id,
        channel_id: channel.id,
        access_token: `mock_access_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_at: expiresAt.toISOString(),
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        action: "channel.connected",
        resource_type: "channel",
        resource_id: channel.id,
        changes: { provider, accountName: accountData.accountName },
      });

      return new Response(JSON.stringify(channel), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List channels
    if (req.method === "GET" && action === "list") {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("connected_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Disconnect channel
    if (req.method === "DELETE") {
      const channelId = pathParts[pathParts.length - 1];

      // Get membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new Error("Insufficient permissions");
      }

      // Delete channel (cascade will delete tokens)
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channelId)
        .eq("workspace_id", membership.workspace_id);

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        action: "channel.disconnected",
        resource_type: "channel",
        resource_id: channelId,
      });

      return new Response(JSON.stringify({ success: true }), {
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