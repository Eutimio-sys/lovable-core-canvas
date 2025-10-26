import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Image, Video, Mic, Download, Trash2, Copy } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export default function AssetLibrary() {
  const { currentWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchAssets = async () => {
    if (!currentWorkspace) return;

    let query = supabase
      .from('assets')
      .select('*')
      .eq('workspace_id', currentWorkspace.id);

    if (activeTab !== 'all') {
      query = query.eq('asset_type', activeTab);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      setAssets(data);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [currentWorkspace, activeTab, searchQuery]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete asset");
    } else {
      toast.success("Asset deleted");
      fetchAssets();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Asset Library
        </h1>
        <p className="text-muted-foreground">Browse and manage your generated assets</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="image">
            <Image className="h-4 w-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Mic className="h-4 w-4 mr-2" />
            Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {assets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <Card key={asset.id} className="group hover:shadow-glow transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                      {asset.asset_type === 'video' ? (
                        <video
                          src={asset.cdn_url || asset.storage_url}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.asset_type === 'audio' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-card">
                          <Mic className="w-16 h-16 text-primary" />
                        </div>
                      ) : (
                        <img
                          src={asset.cdn_url || asset.storage_url}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" asChild>
                          <a href={asset.cdn_url || asset.storage_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => {
                          navigator.clipboard.writeText(asset.cdn_url || asset.storage_url);
                          toast.success("URL copied!");
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(asset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{asset.name}</h3>
                          <p className="text-xs text-muted-foreground">{formatDate(asset.created_at)}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">{asset.asset_type}</Badge>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {asset.width && asset.height && (
                          <>
                            <span>{asset.width}x{asset.height}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatFileSize(asset.file_size)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={activeTab === 'image' ? Image : activeTab === 'video' ? Video : Mic}
              title={`No ${activeTab === 'all' ? 'assets' : activeTab + 's'} found`}
              description={`Generate ${activeTab === 'all' ? 'content' : activeTab + 's'} in the Media Studio to see them here`}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
