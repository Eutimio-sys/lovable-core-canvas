import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Sparkles, Download, Play } from "lucide-react";
import { generateVideo, estimateCredits } from "@/lib/mock-providers";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MediaVideo() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [style, setStyle] = useState("cinematic");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVideo({
        prompt,
        duration: parseInt(duration),
        style,
      });
      setGeneratedVideo(result.url);
      const credits = estimateCredits('video_generation', { duration: parseInt(duration) });
      toast.success(`Video generated! (${credits} credits used)`);
    } catch (error) {
      toast.error("Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Video Generation
        </h1>
        <p className="text-muted-foreground">Create engaging videos with AI</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>Configure your video parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="A time-lapse of a city at sunset..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="animation">Animation</SelectItem>
                  <SelectItem value="timelapse">Time-lapse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline" className="text-xs">
                ~{estimateCredits('video_generation', { duration: parseInt(duration) })} credits
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Video</CardTitle>
            <CardDescription>Your AI-generated video will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedVideo ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border-2 border-primary/20">
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full h-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Save to Library
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extend Video
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <EmptyState
                  icon={Video}
                  title="No video generated yet"
                  description="Configure settings and click Generate to create your video"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
