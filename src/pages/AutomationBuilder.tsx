import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Workflow, Plus, Play, Pause, Trash2, Sparkles } from "lucide-react";

interface AutomationFlow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  trigger_config: any;
  conditions_config: any[];
  actions_config: any[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function AutomationBuilder() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [triggerType, setTriggerType] = useState("post_created");
  const [actionType, setActionType] = useState("schedule_post");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: flows, isLoading } = useQuery({
    queryKey: ["automation-flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_flows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutomationFlow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (flowData: any) => {
      const { data, error } = await supabase
        .from("automation_flows")
        .insert(flowData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-flows"] });
      toast({ title: "Automation flow created successfully" });
      setIsCreateDialogOpen(false);
      setFlowName("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create flow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("automation_flows")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-flows"] });
      toast({ title: "Flow status updated" });
    },
  });

  const testRunMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const { data, error } = await supabase.functions.invoke("automation-engine/test-run", {
        body: { flowId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test run completed",
        description: `Executed ${data.steps.length} steps successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test run failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!flowName) {
      toast({
        title: "Missing information",
        description: "Please enter a flow name",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: flowName,
      description: `Automated workflow: ${flowName}`,
      trigger_config: { type: triggerType },
      conditions_config: [],
      actions_config: [{ type: actionType }],
      is_active: false,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Automation Builder
          </h1>
          <p className="text-muted-foreground">Create and manage automated workflows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Flow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automation Flow</DialogTitle>
              <DialogDescription>
                Set up a new automated workflow with triggers and actions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="flowName">Flow Name</Label>
                <Input
                  id="flowName"
                  placeholder="e.g., Auto-publish to Instagram"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="trigger">Trigger</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post_created">When content is created</SelectItem>
                    <SelectItem value="post_published">When post is published</SelectItem>
                    <SelectItem value="ai_job_done">When AI job completes</SelectItem>
                    <SelectItem value="schedule_reached">At scheduled time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule_post">Schedule post</SelectItem>
                    <SelectItem value="generate_image">Generate image</SelectItem>
                    <SelectItem value="send_notification">Send notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Flow"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automation Flows */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading flows...</div>
            </CardContent>
          </Card>
        ) : flows && flows.length > 0 ? (
          flows.map((flow) => (
            <Card key={flow.id} className={flow.is_active ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-5 w-5" />
                      {flow.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {flow.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={flow.is_active ? "default" : "outline"}>
                      {flow.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Switch
                      checked={flow.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: flow.id, isActive: checked })
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Trigger</Badge>
                    <span className="text-muted-foreground">
                      {flow.trigger_config?.type || "Not configured"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Actions</Badge>
                    <span className="text-muted-foreground">
                      {flow.actions_config?.length || 0} action(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testRunMutation.mutate(flow.id)}
                      disabled={testRunMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium mb-1">No automation flows yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first automated workflow to save time
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Flow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
