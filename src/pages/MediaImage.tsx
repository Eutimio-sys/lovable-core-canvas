import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Sparkles, Download, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MediaImage() {
  const { currentWorkspace } = useWorkspace();
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState("1024");
  const [height, setHeight] = useState("1024");
  const [style, setStyle] = useState("realistic");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !currentWorkspace) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          workspaceId: currentWorkspace.id,
          prompt: prompt.trim(),
          width: parseInt(width),
          height: parseInt(height),
          style: style || undefined,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedImage(data.url);
      toast.success(`Image generated! Used ${data.creditsUsed} credits`);
    } catch (error) {
      toast.error("Failed to generate image");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchRecentImages = async () => {
    if (!currentWorkspace) return;
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .eq('asset_type', 'image')
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (!error && data) {
      setRecentImages(data);
    }
  };

  useEffect(() => {
    fetchRecentImages();
  }, [currentWorkspace]);

  const handleSave = async () => {
    if (!generatedImage || !currentWorkspace) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('assets')
        .insert({
          workspace_id: currentWorkspace.id,
          name: prompt.substring(0, 100) || 'Generated Image',
          asset_type: 'image',
          storage_url: generatedImage,
          cdn_url: generatedImage,
          width: parseInt(width),
          height: parseInt(height),
          ai_params: { prompt, style, width, height },
          mime_type: 'image/png'
        });
      
      if (error) throw error;
      
      toast.success("Image saved to Asset Library!");
      fetchRecentImages();
    } catch (error) {
      toast.error("Failed to save image");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Image Generation
        </h1>
        <p className="text-muted-foreground">Create stunning images with AI</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>Configure your image parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="A beautiful sunset over mountains..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Width</label>
                <Select value={width} onValueChange={setWidth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512px</SelectItem>
                    <SelectItem value="768">768px</SelectItem>
                    <SelectItem value="1024">1024px</SelectItem>
                    <SelectItem value="1536">1536px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Height</label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512px</SelectItem>
                    <SelectItem value="768">768px</SelectItem>
                    <SelectItem value="1024">1024px</SelectItem>
                    <SelectItem value="1536">1536px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="digital-art">Digital Art</SelectItem>
                  <SelectItem value="3d-render">3D Render</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline" className="text-xs">
                ~{Math.ceil((parseInt(width) * parseInt(height)) / 250000)} credits
              </Badge>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>Your AI-generated image will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-primary/20">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="outline" onClick={handleSave} disabled={isSaving} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save to Library"}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Variation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <EmptyState
                  icon={ImageIcon}
                  title="No image generated yet"
                  description="Configure settings and click Generate to create your image"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Images */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Images</CardTitle>
          <CardDescription>Your recently generated images</CardDescription>
        </CardHeader>
        <CardContent>
          {recentImages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {recentImages.map((image) => (
                <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <img
                    src={image.cdn_url || image.storage_url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" onClick={() => setGeneratedImage(image.cdn_url || image.storage_url)}>
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No recent images"
              description="Images you generate will appear here"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
