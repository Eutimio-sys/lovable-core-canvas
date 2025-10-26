import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, History, ExternalLink } from "lucide-react";
import { PlanCard } from "@/components/billing/PlanCard";
import { CreditPackCard } from "@/components/billing/CreditPackCard";
import { UsageHistory } from "@/components/billing/UsageHistory";
import { toast } from "sonner";
import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  amount_cents: number;
  interval: string;
  credits_per_interval: number;
  features: string[];
  stripe_price_id: string;
}

interface Pack {
  id: string;
  name: string;
  amount_cents: number;
  credits: number;
  bonus_credits: number;
  stripe_price_id: string;
}

const WalletBilling = () => {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ["wallet", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id,
  });

  // Fetch available plans
  const { data: plans } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("amount_cents");
      
      if (error) throw error;
      return data as any as Plan[];
    },
  });

  // Fetch available credit packs
  const { data: packs } = useQuery({
    queryKey: ["billing-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packs")
        .select("*")
        .eq("is_active", true)
        .order("amount_cents");
      
      if (error) throw error;
      return data as any as Pack[];
    },
  });

  const handleSelectPlan = async (plan: Plan) => {
    if (!plan.stripe_price_id) {
      toast.error("This plan is not yet configured for checkout");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          type: "subscription",
          priceId: plan.stripe_price_id,
          workspaceId: currentWorkspace?.id,
          successUrl: `${window.location.origin}/wallet-billing?success=true`,
          cancelUrl: `${window.location.origin}/wallet-billing?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePack = async (pack: Pack) => {
    if (!pack.stripe_price_id) {
      toast.error("This pack is not yet configured for checkout");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          type: "payment",
          priceId: pack.stripe_price_id,
          workspaceId: currentWorkspace?.id,
          successUrl: `${window.location.origin}/wallet-billing?success=true`,
          cancelUrl: `${window.location.origin}/wallet-billing?canceled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    const stripeCustomerId = (currentWorkspace as any)?.stripe_customer_id;
    if (!stripeCustomerId) {
      toast.error("No billing account found");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: {
          customerId: stripeCustomerId,
          returnUrl: `${window.location.origin}/wallet-billing`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet & Billing</h1>
            <p className="text-muted-foreground mt-1">Manage your credits and subscriptions</p>
          </div>
          {(currentWorkspace as any)?.stripe_customer_id && (
            <Button onClick={handleOpenPortal} disabled={loading} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallet?.balance?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">credits remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(currentWorkspace as any)?.subscription_status || "Free"}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {(currentWorkspace as any)?.subscription_status || "No active subscription"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Spent</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(((wallet as any)?.lifetime_spent_cents || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">total spending</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="packs">Credit Packs</TabsTrigger>
            <TabsTrigger value="history">Usage History</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>
                  Select a subscription plan that fits your needs. Get monthly credits and exclusive features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {plans?.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      name={plan.name}
                      price={plan.amount_cents}
                      interval={plan.interval || "month"}
                      credits={plan.credits_per_interval}
                      features={(plan.features as string[]) || []}
                      isCurrentPlan={(currentWorkspace as any)?.current_plan_id === plan.id}
                      onSelect={() => handleSelectPlan(plan)}
                      loading={loading}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buy Credit Packs</CardTitle>
                <CardDescription>
                  One-time credit purchases with bonus credits. Perfect for occasional use or topping up your balance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {packs?.map((pack) => (
                    <CreditPackCard
                      key={pack.id}
                      name={pack.name}
                      price={pack.amount_cents}
                      credits={pack.credits}
                      bonusCredits={pack.bonus_credits || 0}
                      onPurchase={() => handlePurchasePack(pack)}
                      loading={loading}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {currentWorkspace?.id && <UsageHistory workspaceId={currentWorkspace.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default WalletBilling;