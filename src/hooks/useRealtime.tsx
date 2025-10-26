import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const useRealtimeJobs = (workspaceId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Job update:', payload);
          
          // Invalidate jobs query to refetch
          queryClient.invalidateQueries({ queryKey: ['jobs', workspaceId] });
          
          // Show toast for completed jobs
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
            toast({
              title: 'Job Completed',
              description: `${payload.new.job_type} job finished successfully`,
            });
          }
          
          // Show toast for failed jobs
          if (payload.eventType === 'UPDATE' && payload.new.status === 'failed') {
            toast({
              title: 'Job Failed',
              description: payload.new.error_message || 'Job execution failed',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
};

export const useRealtimeAssets = (workspaceId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('assets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assets',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('New asset:', payload);
          
          // Invalidate assets query to refetch
          queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
          
          toast({
            title: 'New Asset Created',
            description: `${payload.new.name} has been added to your library`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
};

export const useRealtimeScheduledPosts = (workspaceId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('scheduled-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Scheduled post update:', payload);
          
          // Invalidate scheduled posts query
          queryClient.invalidateQueries({ queryKey: ['scheduled-posts', workspaceId] });
          
          // Show toast for published posts
          if (payload.eventType === 'UPDATE' && payload.new.status === 'published') {
            toast({
              title: 'Post Published',
              description: 'Your scheduled post has been published successfully',
            });
          }
          
          // Show toast for failed posts
          if (payload.eventType === 'UPDATE' && payload.new.status === 'failed') {
            toast({
              title: 'Post Failed',
              description: payload.new.error_message || 'Failed to publish post',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
};

export const useRealtimeAutomationRuns = (workspaceId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('automation-runs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_runs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Automation run update:', payload);
          
          // Invalidate automation runs query
          queryClient.invalidateQueries({ queryKey: ['automation-runs', workspaceId] });
          
          // Show toast for completed runs
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
            toast({
              title: 'Automation Completed',
              description: 'Your automation workflow has finished successfully',
            });
          }
          
          // Show toast for failed runs
          if (payload.eventType === 'UPDATE' && payload.new.status === 'failed') {
            toast({
              title: 'Automation Failed',
              description: payload.new.error_message || 'Automation execution failed',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
};
