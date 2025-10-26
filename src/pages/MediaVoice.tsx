import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Mic, Sparkles, Download, Play } from "lucide-react";
import { generateAudio, estimateCredits } from "@/lib/mock-providers";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MediaVoice() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("professional");
  const [speed, setSpeed] = useState([1.0]);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter text to convert");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAudio({
        text,
        voice,
        speed: speed[0],
      });
      setGeneratedAudio(result.url);
      const credits = estimateCredits('audio_generation', { text });
      toast.success(`Voice generated! (${credits} credits used)`);
    } catch (error) {
      toast.error("Failed to generate voice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Voice Generation
        </h1>
        <p className="text-muted-foreground">Convert text to natural-sounding speech</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>Configure your voice parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Convert</label>
              <Textarea
                placeholder="Enter the text you want to convert to speech..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {text.split(' ').filter(w => w).length} words
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Voice Type</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="storyteller">Storyteller</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Speed: {speed[0].toFixed(1)}x</label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="outline" className="text-xs">
                ~{estimateCredits('audio_generation', { text })} credits
              </Badge>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
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
            <CardTitle>Generated Voice</CardTitle>
            <CardDescription>Your AI-generated voice will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedAudio ? (
              <div className="space-y-4">
                <div className="p-8 rounded-lg bg-gradient-card border-2 border-primary/20">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mic className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <audio
                    src={generatedAudio}
                    controls
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Save to Library
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <EmptyState
                  icon={Mic}
                  title="No voice generated yet"
                  description="Enter text and click Generate to create natural-sounding speech"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
