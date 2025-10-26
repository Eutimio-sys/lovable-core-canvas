import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workspace, Membership } from "@/types";

export function useWorkspace() {
  // Get user's workspaces
  const { data: workspaces, isLoading: loadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Workspace[];
    },
  });

  // Get current user's memberships
  const { data: memberships, isLoading: loadingMemberships } = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Membership[];
    },
  });

  // Get current workspace (first one for now)
  const currentWorkspace = workspaces?.[0] || null;
  const currentMembership = memberships?.find(
    (m) => m.workspace_id === currentWorkspace?.id
  );

  return {
    workspaces,
    currentWorkspace,
    currentMembership,
    userRole: currentMembership?.role || "guest",
    isLoading: loadingWorkspaces || loadingMemberships,
  };
}
