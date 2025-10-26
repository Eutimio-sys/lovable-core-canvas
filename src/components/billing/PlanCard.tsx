import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlanCardProps {
  name: string;
  price: number;
  interval: string;
  credits: number;
  features: string[];
  isCurrentPlan?: boolean;
  onSelect: () => void;
  loading?: boolean;
}

export function PlanCard({
  name,
  price,
  interval,
  credits,
  features,
  isCurrentPlan,
  onSelect,
  loading,
}: PlanCardProps) {
  return (
    <Card className={isCurrentPlan ? "border-primary shadow-lg" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{name}</CardTitle>
          {isCurrentPlan && <Badge>Current Plan</Badge>}
        </div>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            ${(price / 100).toFixed(2)}
          </span>
          <span className="text-muted-foreground">/{interval}</span>
        </CardDescription>
        <p className="text-sm text-muted-foreground">{credits.toLocaleString()} credits per {interval}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={onSelect}
          disabled={isCurrentPlan || loading}
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {isCurrentPlan ? "Current Plan" : "Select Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}