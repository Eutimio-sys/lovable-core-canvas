import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Image, Video, Mic, Download, Trash2, Copy } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AssetLibrary() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const mockAssets = [
    {
      id: "1",
      type: "image",
      name: "Product Banner",
      url: "https://images.unsplash.com/photo-1557683316-973673baf926",
      size: "2.4 MB",
      dimensions: "1920x1080",
      created: "2 days ago",
    },
    {
      id: "2",
      type: "image",
      name: "Social Media Post",
      url: "https://images.unsplash.com/photo-1614850715649-1d0106293bd1",
      size: "1.8 MB",
      dimensions: "1080x1080",
      created: "3 days ago",
    },
  ];

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

      <Tabs defaultValue="all" className="w-full">
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

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockAssets.map((asset) => (
              <Card key={asset.id} className="group hover:shadow-glow transition-shadow">
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{asset.name}</h3>
                        <p className="text-xs text-muted-foreground">{asset.created}</p>
                      </div>
                      <Badge variant="outline">{asset.type}</Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{asset.dimensions}</span>
                      <span>•</span>
                      <span>{asset.size}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="image">
          <EmptyState
            icon={Image}
            title="No images found"
            description="Generate images in the Media Studio to see them here"
          />
        </TabsContent>

        <TabsContent value="video">
          <EmptyState
            icon={Video}
            title="No videos found"
            description="Generate videos in the Media Studio to see them here"
          />
        </TabsContent>

        <TabsContent value="audio">
          <EmptyState
            icon={Mic}
            title="No audio files found"
            description="Generate voice content in the Media Studio to see it here"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
