import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ContentStudio() {
  const { currentWorkspace } = useWorkspace();
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState("post");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentContents, setRecentContents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !currentWorkspace) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: {
          workspaceId: currentWorkspace.id,
          prompt: prompt.trim(),
          contentType,
          maxLength: 500,
          tone: "professional",
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedContent(data.text);
      toast.success(`Content generated! Used ${data.creditsUsed} credits`);
    } catch (error) {
      toast.error("Failed to generate content");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchRecentContents = async () => {
    if (!currentWorkspace) return;
    
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (!error && data) {
      setRecentContents(data);
    }
  };

  useEffect(() => {
    fetchRecentContents();
  }, [currentWorkspace]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Copied to clipboard!");
  };

  const handleSave = async () => {
    if (!generatedContent || !currentWorkspace) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save");
        return;
      }

      const { error } = await supabase
        .from('contents')
        .insert({
          workspace_id: currentWorkspace.id,
          created_by: user.id,
          title: prompt.substring(0, 100) || 'Generated Content',
          content: generatedContent,
          content_type: contentType,
          status: 'draft',
          ai_params: { prompt, contentType }
        });
      
      if (error) throw error;
      
      toast.success("Content saved as draft!");
      fetchRecentContents();
    } catch (error) {
      toast.error("Failed to save content");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Content Studio
        </h1>
        <p className="text-muted-foreground">Generate high-quality content with AI</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Content Generation</CardTitle>
            <CardDescription>
              Describe what you want to create and let AI do the magic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Social Media Post</SelectItem>
                  <SelectItem value="caption">Caption</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="script">Video Script</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="Example: Write a post about the benefits of AI in marketing..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                ~1 credit
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
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>Your AI-generated content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-4">
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopy} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={handleSave} disabled={isSaving} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No content yet"
                description="Generate your first piece of content using the form on the left"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contents</CardTitle>
          <CardDescription>Your previously generated content</CardDescription>
        </CardHeader>
        <CardContent>
          {recentContents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentContents.map((content) => (
                <Card key={content.id} className="group hover:shadow-glow transition-shadow cursor-pointer" onClick={() => setGeneratedContent(content.content || '')}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium line-clamp-1">{content.title}</h4>
                        <Badge variant="outline" className="ml-2">{content.content_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {content.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No saved content"
              description="Content you save will appear here for easy access"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
