import { useState, useEffect } from "react";
import { Coins, FileText, Image, TrendingUp, Zap } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { JobQueuePanel } from "@/components/shared/JobQueuePanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Job } from "@/types";

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: "1",
        workspace_id: "ws-1",
        job_type: "image_generation",
        provider: "stability",
        status: "running",
        progress: 65,
        input_params: { prompt: "Modern minimalist office space" },
        output_data: null,
        error_message: null,
        credits_estimated: 5,
        credits_actual: null,
        asset_id: null,
        content_id: null,
        created_by: "user-1",
        started_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        workspace_id: "ws-1",
        job_type: "text_generation",
        provider: "gemini",
        status: "completed",
        progress: 100,
        input_params: { prompt: "Write a blog post about AI" },
        output_data: { text: "..." },
        error_message: null,
        credits_estimated: 1,
        credits_actual: 1,
        asset_id: null,
        content_id: "content-1",
        created_by: "user-1",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    setRecentJobs(mockJobs);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back! Here's your workspace overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Available Credits"
          value="1,247"
          description="Pro plan"
          icon={Coins}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Content Created"
          value="38"
          description="This month"
          icon={FileText}
          trend={{ value: 23, isPositive: true }}
        />
        <StatsCard
          title="Assets Generated"
          value="156"
          description="Total assets"
          icon={Image}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Active Jobs"
          value="3"
          description="In progress"
          icon={Zap}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Queue */}
        <JobQueuePanel jobs={recentJobs} title="Recent Jobs" />

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Credit consumption by feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Image Generation", value: 45, color: "bg-primary" },
                { label: "Text Generation", value: 25, color: "bg-accent" },
                { label: "Video Generation", value: 20, color: "bg-success" },
                { label: "Voice Generation", value: 10, color: "bg-warning" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-300`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Created new content", item: "Summer Campaign Post", time: "2 hours ago" },
              { action: "Generated image", item: "Product showcase banner", time: "4 hours ago" },
              { action: "Invited team member", item: "john@example.com", time: "Yesterday" },
              { action: "Topped up credits", item: "+500 credits", time: "2 days ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.item}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
