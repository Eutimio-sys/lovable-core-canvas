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

    // Test run automation flow
    if (req.method === "POST" && action === "test-run") {
      const { flowId, testData } = await req.json();

      // Get flow
      const { data: flow } = await supabase
        .from("automation_flows")
        .select("*")
        .eq("id", flowId)
        .single();

      if (!flow) throw new Error("Flow not found");

      // Simulate execution
      const steps = [];
      
      // Evaluate trigger
      steps.push({
        type: "trigger",
        name: flow.trigger_config?.type || "unknown",
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      // Evaluate conditions
      for (const condition of flow.conditions_config || []) {
        steps.push({
          type: "condition",
          name: condition.type,
          status: "completed",
          result: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Execute actions
      for (const action of flow.actions_config || []) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
        steps.push({
          type: "action",
          name: action.type,
          status: "completed",
          timestamp: new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          steps,
          message: "Test run completed successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // List automation runs
    if (req.method === "GET" && action === "runs") {
      const flowId = url.searchParams.get("flowId");
      
      let query = supabase
        .from("automation_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (flowId) {
        query = query.eq("flow_id", flowId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger automation flow
    if (req.method === "POST" && action === "trigger") {
      const { flowId, triggerData } = await req.json();

      // Get membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) throw new Error("No workspace membership found");

      // Get flow
      const { data: flow } = await supabase
        .from("automation_flows")
        .select("*")
        .eq("id", flowId)
        .eq("is_active", true)
        .single();

      if (!flow) throw new Error("Flow not found or inactive");

      // Hold credits (1 for trigger + 1 per action)
      const creditsToHold = 1 + (flow.actions_config?.length || 0);
      
      const { data: holdSuccess } = await supabase.rpc("hold_credits", {
        p_workspace_id: membership.workspace_id,
        p_amount: creditsToHold,
        p_job_id: null,
        p_description: `Automation flow: ${flow.name}`,
      });

      if (!holdSuccess) {
        throw new Error("Insufficient credits");
      }

      // Create automation run
      const { data: run, error } = await supabase
        .from("automation_runs")
        .insert({
          workspace_id: membership.workspace_id,
          flow_id: flowId,
          status: "running",
          trigger_data: triggerData || {},
          credits_held: creditsToHold,
          steps: [],
        })
        .select()
        .single();

      if (error) throw error;

      // Execute flow asynchronously (in real implementation, this would be a queue)
      // For now, simulate completion
      setTimeout(async () => {
        const steps = [];
        let creditsUsed = 1; // Trigger cost

        // Execute actions
        for (const action of flow.actions_config || []) {
          steps.push({
            type: "action",
            name: action.type,
            status: "completed",
            timestamp: new Date().toISOString(),
          });
          creditsUsed += 1;
        }

        // Update run
        await supabase
          .from("automation_runs")
          .update({
            status: "completed",
            steps,
            credits_actual: creditsUsed,
            finished_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        // Finalize credits
        await supabase.rpc("finalize_credits", {
          p_workspace_id: membership.workspace_id,
          p_held_amount: creditsToHold,
          p_actual_amount: creditsUsed,
          p_job_id: null,
          p_description: `Automation completed: ${flow.name}`,
        });

        // Send notification
        await supabase.from("notifications").insert({
          workspace_id: membership.workspace_id,
          user_id: user.id,
          type: "automation_completed",
          title: "Automation Completed",
          message: `Flow "${flow.name}" completed successfully`,
          payload: { flowId, runId: run.id },
        });
      }, 3000);

      return new Response(JSON.stringify(run), {
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