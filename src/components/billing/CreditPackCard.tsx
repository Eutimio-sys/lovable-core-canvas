import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CreditPackCardProps {
  name: string;
  price: number;
  credits: number;
  bonusCredits: number;
  onPurchase: () => void;
  loading?: boolean;
}

export function CreditPackCard({
  name,
  price,
  credits,
  bonusCredits,
  onPurchase,
  loading,
}: CreditPackCardProps) {
  const totalCredits = credits + bonusCredits;
  const hasBonus = bonusCredits > 0;

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {hasBonus && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              +{bonusCredits} Bonus
            </Badge>
          )}
        </div>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            ${(price / 100).toFixed(2)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Credits:</span>
            <span className="font-medium">{credits.toLocaleString()}</span>
          </div>
          {hasBonus && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonus Credits:</span>
              <span className="font-medium text-primary">+{bonusCredits.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold pt-2 border-t">
            <span>Total Credits:</span>
            <span>{totalCredits.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            ${((price / 100) / totalCredits).toFixed(4)} per credit
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={onPurchase}
          disabled={loading}
        >
          Purchase Pack
        </Button>
      </CardFooter>
    </Card>
  );
}