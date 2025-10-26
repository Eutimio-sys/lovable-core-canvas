import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Sparkles, Download, Heart } from "lucide-react";
import { generateImage, estimateCredits } from "@/lib/mock-providers";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MediaImage() {
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState("1024");
  const [height, setHeight] = useState("1024");
  const [style, setStyle] = useState("realistic");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImage({
        prompt,
        width: parseInt(width),
        height: parseInt(height),
        style,
      });
      setGeneratedImage(result.url);
      const credits = estimateCredits('image_generation', { width: parseInt(width), height: parseInt(height) });
      toast.success(`Image generated! (${credits} credits used)`);
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    toast.success("Image saved to Asset Library!");
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
                ~{estimateCredits('image_generation', { width: parseInt(width), height: parseInt(height) })} credits
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
                  <Button variant="outline" onClick={handleSave} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Save to Library
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
    </div>
  );
}
