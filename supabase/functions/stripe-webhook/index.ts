import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the event
    await supabase.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as any,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspace_id;
  if (!workspaceId) return;

  // Update workspace with customer ID
  if (session.customer) {
    await supabase
      .from('workspaces')
      .update({ stripe_customer_id: session.customer })
      .eq('id', workspaceId);
  }
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  // Add credits to wallet based on subscription
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Fetch workspace by subscription ID
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, current_plan_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!workspace) return;

  // Fetch plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('credits_per_interval')
    .eq('id', workspace.current_plan_id)
    .single();

  if (!plan) return;

  // Add credits to wallet
  await supabase.rpc('add_credits', {
    p_workspace_id: workspace.id,
    p_amount: plan.credits_per_interval,
    p_description: `Monthly subscription credits - ${new Date().toLocaleDateString()}`,
  });

  // Update wallet payment tracking
  await supabase
    .from('wallets')
    .update({
      last_payment_at: new Date().toISOString(),
      last_payment_amount: invoice.amount_paid,
      lifetime_spent_cents: supabase.raw(`lifetime_spent_cents + ${invoice.amount_paid}`),
    })
    .eq('workspace_id', workspace.id);
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!workspace) return;

  await supabase
    .from('workspaces')
    .update({
      subscription_status: subscription.status,
      subscription_end_at: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
    })
    .eq('id', workspace.id);
}

async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  // Handle one-time credit pack purchases
  const workspaceId = paymentIntent.metadata?.workspace_id;
  const packId = paymentIntent.metadata?.pack_id;

  if (!workspaceId || !packId) return;

  // Fetch pack details
  const { data: pack } = await supabase
    .from('packs')
    .select('credits, bonus_credits')
    .eq('id', packId)
    .single();

  if (!pack) return;

  const totalCredits = pack.credits + (pack.bonus_credits || 0);

  // Add credits to wallet
  await supabase.rpc('add_credits', {
    p_workspace_id: workspaceId,
    p_amount: totalCredits,
    p_description: `Credit pack purchase - ${totalCredits} credits`,
  });

  // Update wallet payment tracking
  await supabase
    .from('wallets')
    .update({
      last_payment_at: new Date().toISOString(),
      last_payment_amount: paymentIntent.amount,
      lifetime_spent_cents: supabase.raw(`lifetime_spent_cents + ${paymentIntent.amount}`),
    })
    .eq('workspace_id', workspaceId);
}