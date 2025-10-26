import { useState, useEffect } from "react";
import { Coins, FileText, Image, TrendingUp, Zap, Bell, Calendar } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { JobQueuePanel } from "@/components/shared/JobQueuePanel";
import { NotificationPanel } from "@/components/shared/NotificationPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Job } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    credits: 0,
    heldCredits: 0,
    totalAssets: 0,
    totalContent: 0,
    activeJobs: 0,
    scheduledPosts: 0,
    automationRuns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    fetchDashboardData();
  }, [currentWorkspace]);

  const fetchDashboardData = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);

      // Fetch wallet info
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, held_balance')
        .eq('workspace_id', currentWorkspace.id)
        .single();

      // Fetch jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch assets count
      const { count: assetsCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id);

      // Fetch content count
      const { count: contentCount } = await supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id);

      // Fetch active jobs count
      const { count: activeJobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id)
        .in('status', ['queued', 'running']);

      // Fetch scheduled posts count
      const { count: scheduledCount } = await supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'scheduled');

      // Fetch automation runs count
      const { count: automationCount } = await supabase
        .from('automation_runs')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'running');

      setStats({
        credits: wallet?.balance || 0,
        heldCredits: wallet?.held_balance || 0,
        totalAssets: assetsCount || 0,
        totalContent: contentCount || 0,
        activeJobs: activeJobsCount || 0,
        scheduledPosts: scheduledCount || 0,
        automationRuns: automationCount || 0,
      });

      setRecentJobs((jobs || []) as Job[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back! Here's your workspace overview.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Available Credits"
          value={loading ? "..." : stats.credits.toLocaleString()}
          description={`${stats.heldCredits} held`}
          icon={Coins}
        />
        <StatsCard
          title="Content Created"
          value={loading ? "..." : stats.totalContent.toString()}
          description="Total content"
          icon={FileText}
        />
        <StatsCard
          title="Assets Generated"
          value={loading ? "..." : stats.totalAssets.toString()}
          description="Total assets"
          icon={Image}
        />
        <StatsCard
          title="Active Jobs"
          value={loading ? "..." : stats.activeJobs.toString()}
          description="In progress"
          icon={Zap}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
                  <p className="text-sm text-muted-foreground">Scheduled Posts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.automationRuns}</p>
                  <p className="text-sm text-muted-foreground">Active Automations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Queue */}
        <JobQueuePanel jobs={recentJobs} title="Recent Jobs" />

        {/* Notifications */}
        <NotificationPanel />
      </div>

      {/* Credit Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Credit Distribution
          </CardTitle>
          <CardDescription>Breakdown of credit usage by feature type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available</span>
                  <span className="text-lg font-bold text-success">{stats.credits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Held (Pending)</span>
                  <span className="text-lg font-bold text-warning">{stats.heldCredits}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Credits are held when jobs are queued and finalized upon completion
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
