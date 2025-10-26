import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function Scheduler() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Scheduler
        </h1>
        <p className="text-muted-foreground">Schedule and automate your content distribution</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Content Calendar
          </CardTitle>
          <CardDescription>
            Phase 2 Feature - Schedule posts across multiple platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Scheduler Coming Soon"
            description="This feature will be available in Phase 2. You'll be able to schedule content across social media platforms and automate your workflows."
          />
        </CardContent>
      </Card>
    </div>
  );
}
