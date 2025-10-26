import { Coins, CreditCard, TrendingUp, Zap } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function WalletBilling() {
  // Mock data
  const currentPlan = "Pro";
  const creditsBalance = 1247;
  const monthlyAllowance = 1200;
  const creditsUsed = 953;
  const usagePercentage = (creditsUsed / (creditsBalance + creditsUsed)) * 100;

  const recentTransactions = [
    { id: "1", type: "usage", description: "Image Generation", amount: -5, date: "2 hours ago" },
    { id: "2", type: "usage", description: "Text Generation", amount: -1, date: "3 hours ago" },
    { id: "3", type: "purchase", description: "Credit Top-up", amount: +500, date: "Yesterday" },
    { id: "4", type: "grant", description: "Monthly Allowance", amount: +1200, date: "5 days ago" },
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      credits: 20,
      features: ["20 credits/month", "Basic AI models", "Watermarked outputs", "Community support"],
    },
    {
      name: "Creator",
      price: "$15",
      credits: 300,
      features: ["300 credits/month", "All AI models", "No watermarks", "Priority support"],
      popular: false,
    },
    {
      name: "Pro",
      price: "$49",
      credits: 1200,
      features: ["1,200 credits/month", "Advanced models", "API access", "Premium support"],
      popular: true,
    },
    {
      name: "Team",
      price: "$99",
      credits: 3000,
      features: ["3,000 credits/month", "Team collaboration", "Admin controls", "Dedicated support"],
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Wallet & Billing
        </h1>
        <p className="text-muted-foreground">Manage your credits and subscription</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Available Credits"
          value={creditsBalance.toLocaleString()}
          icon={Coins}
          className="md:col-span-2"
        />
        <StatsCard
          title="Current Plan"
          value={currentPlan}
          description={`${monthlyAllowance} credits/month`}
          icon={CreditCard}
        />
        <StatsCard
          title="Credits Used"
          value={creditsUsed.toLocaleString()}
          description="This billing cycle"
          icon={TrendingUp}
        />
      </div>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
          <CardDescription>Your credit consumption this month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{creditsUsed} / {monthlyAllowance + creditsBalance} credits used</span>
              <span className="text-muted-foreground">{usagePercentage.toFixed(0)}%</span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
          </div>
          <Button className="w-full bg-gradient-primary hover:opacity-90">
            <Zap className="h-4 w-4 mr-2" />
            Top Up Credits
          </Button>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-glow" : ""}>
              {plan.popular && (
                <div className="bg-gradient-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Free" && <span className="text-muted-foreground">/month</span>}
                </div>
                <CardDescription className="mt-2">
                  <Badge variant="outline">{plan.credits} credits</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={plan.name === currentPlan ? "outline" : "default"}
                  disabled={plan.name === currentPlan}
                >
                  {plan.name === currentPlan ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your credit transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <Badge
                  variant={tx.amount > 0 ? "default" : "outline"}
                  className={tx.amount > 0 ? "bg-success" : ""}
                >
                  {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
