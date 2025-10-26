import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UsageHistoryProps {
  workspaceId: string;
}

export function UsageHistory({ workspaceId }: UsageHistoryProps) {
  const { data: usageHistory, isLoading } = useQuery({
    queryKey: ["usage-history", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_ledger")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage History</CardTitle>
        <CardDescription>Recent credit transactions and usage</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : usageHistory && usageHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">
                    {format(new Date(entry.created_at), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">{entry.description}</TableCell>
                  <TableCell>
                    <Badge variant={entry.amount > 0 ? "default" : "secondary"}>
                      {entry.amount > 0 ? "Credit" : "Debit"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${entry.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {entry.amount > 0 ? "+" : ""}{entry.amount}
                  </TableCell>
                  <TableCell className="text-right">{entry.balance_after}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No usage history yet</p>
        )}
      </CardContent>
    </Card>
  );
}