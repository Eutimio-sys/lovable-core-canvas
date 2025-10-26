import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Twitter, Linkedin, Video, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Channel, SocialProvider } from "@/types";

const providerConfig: Record<SocialProvider, { name: string; icon: any; color: string }> = {
  facebook_ig: { name: "Facebook/Instagram", icon: Facebook, color: "text-blue-500" },
  x: { name: "X (Twitter)", icon: Twitter, color: "text-sky-500" },
  linkedin: { name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  tiktok: { name: "TikTok", icon: Video, color: "text-pink-500" },
};

export default function Connections() {
  const [connectingProvider, setConnectingProvider] = useState<SocialProvider | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channels, isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("channels/list");
      if (error) throw error;
      return data as Channel[];
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: SocialProvider) => {
      const { data, error } = await supabase.functions.invoke("channels/connect", {
        body: { provider },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast({ title: "Channel connected successfully" });
      setConnectingProvider(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect channel",
        description: error.message,
        variant: "destructive",
      });
      setConnectingProvider(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase.functions.invoke(`channels/${channelId}`, {
        method: "DELETE",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast({ title: "Channel disconnected" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect channel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnect = (provider: SocialProvider) => {
    setConnectingProvider(provider);
    connectMutation.mutate(provider);
  };

  const connectedProviders = new Set(channels?.map(c => c.provider) || []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Social Connections
        </h1>
        <p className="text-muted-foreground">Connect your social media accounts to publish content</p>
      </div>

      {/* Available Providers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(providerConfig).map(([provider, config]) => {
          const Icon = config.icon;
          const isConnected = connectedProviders.has(provider as SocialProvider);
          const isConnecting = connectingProvider === provider;

          return (
            <Card key={provider} className={isConnected ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 ${config.color}`} />
                  {isConnected && <CheckCircle2 className="h-5 w-5 text-success" />}
                </div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleConnect(provider as SocialProvider)}
                  disabled={isConnected || isConnecting}
                  variant={isConnected ? "outline" : "default"}
                  className="w-full"
                >
                  {isConnecting ? (
                    "Connecting..."
                  ) : isConnected ? (
                    "Connected"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Channels</CardTitle>
          <CardDescription>Manage your connected social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading channels...</div>
          ) : channels && channels.length > 0 ? (
            <div className="space-y-3">
              {channels.map((channel) => {
                const config = providerConfig[channel.provider];
                const Icon = config.icon;
                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={`h-6 w-6 ${config.color}`} />
                      <div>
                        <p className="font-medium">{channel.account_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.name} • Connected {new Date(channel.connected_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={channel.status === "active" ? "default" : "destructive"}>
                        {channel.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => disconnectMutation.mutate(channel.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No channels connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a social media account above to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
