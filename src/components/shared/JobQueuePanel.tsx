import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Job, JobStatus } from "@/types";

interface JobQueuePanelProps {
  jobs: Job[];
  title?: string;
}

const statusConfig: Record<JobStatus, { icon: typeof Loader2; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
  running: { icon: Loader2, color: "text-primary", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-success", label: "Completed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", label: "Cancelled" },
};

export function JobQueuePanel({ jobs, title = "Job Queue" }: JobQueuePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{jobs.length} jobs in queue</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active jobs</p>
            ) : (
              jobs.map((job) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;

                return (
                  <div key={job.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`h-4 w-4 ${config.color} ${job.status === 'running' ? 'animate-spin' : ''}`}
                        />
                        <span className="text-sm font-medium">
                          {job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                    {job.status === 'running' && (
                      <Progress value={job.progress} className="h-2" />
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {job.input_params?.prompt || 'Processing...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
