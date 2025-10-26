import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, Send, Facebook, Twitter, Linkedin, Video } from "lucide-react";
import { ScheduledPost, Channel, SocialProvider } from "@/types";
import { format } from "date-fns";

const providerIcons: Record<SocialProvider, any> = {
  facebook_ig: Facebook,
  x: Twitter,
  linkedin: Linkedin,
  tiktok: Video,
};

export default function Scheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: channels } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("channels/list");
      if (error) throw error;
      return data as Channel[];
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("scheduler-publish/list");
      if (error) throw error;
      return data as ScheduledPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (postData: any) => {
      const { data, error } = await supabase.functions.invoke("scheduler-publish/create", {
        body: postData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast({ title: "Post scheduled successfully" });
      setIsCreateDialogOpen(false);
      setCaption("");
      setScheduleAt("");
      setSelectedProviders([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!caption || !scheduleAt || selectedProviders.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select at least one platform",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      caption,
      scheduleAt,
      providerTargets: selectedProviders,
      assetIds: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleProviderToggle = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const upcomingPosts = posts?.filter(p => ['draft', 'scheduled', 'queued'].includes(p.status)) || [];
  const pastPosts = posts?.filter(p => ['published', 'failed', 'cancelled'].includes(p.status)) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Content Scheduler
          </h1>
          <p className="text-muted-foreground">Schedule and manage your social media posts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Post</DialogTitle>
              <DialogDescription>
                Create and schedule content to publish across your connected channels
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write your post caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="scheduleAt">Schedule Date & Time</Label>
                <Input
                  id="scheduleAt"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </div>
              <div>
                <Label>Select Platforms</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {channels?.map((channel) => {
                    const Icon = providerIcons[channel.provider];
                    return (
                      <div
                        key={channel.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => handleProviderToggle(channel.provider)}
                      >
                        <Checkbox
                          checked={selectedProviders.includes(channel.provider)}
                          onCheckedChange={() => handleProviderToggle(channel.provider)}
                        />
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{channel.account_name}</span>
                      </div>
                    );
                  })}
                </div>
                {channels?.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No channels connected. Please connect a channel first.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Scheduling..." : "Schedule Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Posts
          </CardTitle>
          <CardDescription>Posts scheduled for future publication</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : upcomingPosts.length > 0 ? (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(post.schedule_at), "PPp")}
                      </span>
                      <div className="flex items-center gap-1">
                        {post.provider_targets.map((provider) => {
                          const Icon = providerIcons[provider as SocialProvider];
                          return Icon ? <Icon key={provider} className="h-4 w-4" /> : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge variant={post.status === 'scheduled' ? 'default' : 'outline'}>
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No upcoming posts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Published and completed posts</CardDescription>
        </CardHeader>
        <CardContent>
          {pastPosts.length > 0 ? (
            <div className="space-y-3">
              {pastPosts.slice(0, 10).map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{format(new Date(post.schedule_at), "PPp")}</span>
                      <div className="flex items-center gap-1">
                        {post.provider_targets.map((provider) => {
                          const Icon = providerIcons[provider as SocialProvider];
                          return Icon ? <Icon key={provider} className="h-4 w-4" /> : null;
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={post.status === 'published' ? 'default' : post.status === 'failed' ? 'destructive' : 'outline'}
                  >
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No activity yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
