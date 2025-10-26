// Mock AI Provider Adapters
// These simulate API calls to AI services with realistic delays

export type ProviderType = 'gemini' | 'openai' | 'stability' | 'runway' | 'elevenlabs';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface TextGenerationParams {
  prompt: string;
  contentType: string;
  maxLength?: number;
  tone?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
}

export interface VideoGenerationParams {
  prompt: string;
  duration?: number;
  style?: string;
}

export interface AudioGenerationParams {
  text: string;
  voice?: string;
  speed?: number;
}

// Text Generation Provider (Mock)
export const generateText = async (params: TextGenerationParams, provider: ProviderType = 'gemini'): Promise<string> => {
  console.log(`[Mock ${provider}] Generating text...`, params);
  await delay(2000 + Math.random() * 1000);

  const templates: Record<string, string> = {
    post: `🚀 Exciting news! Here's what we've been working on...\n\n${params.prompt}\n\nWhat do you think? Drop a comment below! 👇\n\n#innovation #ai #content`,
    caption: `✨ ${params.prompt}\n\n📸 Making memories one moment at a time\n\n#lifestyle #inspiration`,
    article: `# ${params.prompt}\n\n## Introduction\n\nIn today's digital landscape, content creation has evolved dramatically...\n\n## Key Points\n\n1. Innovation drives success\n2. Quality matters more than quantity\n3. Authenticity builds trust\n\n## Conclusion\n\nAs we move forward, the future of content creation looks brighter than ever.`,
    script: `[SCENE 1 - OPENING]\n\nNarrator: "${params.prompt}"\n\n[Visual: Dynamic intro animation]\n\n[SCENE 2 - MAIN CONTENT]\n\n...\n\n[SCENE 3 - CALL TO ACTION]\n\nNarrator: "Don't forget to like and subscribe!"`,
    email: `Subject: ${params.prompt}\n\nHi there,\n\nWe're excited to share some great news with you...\n\n[Your personalized message here]\n\nBest regards,\nYour Team`
  };

  return templates[params.contentType] || `Generated content for: ${params.prompt}\n\nThis is a simulated response from ${provider}.`;
};

// Image Generation Provider (Mock)
export const generateImage = async (params: ImageGenerationParams, provider: ProviderType = 'stability'): Promise<{ url: string; width: number; height: number }> => {
  console.log(`[Mock ${provider}] Generating image...`, params);
  await delay(3000 + Math.random() * 2000);

  const width = params.width || 1024;
  const height = params.height || 1024;
  
  // Return placeholder image URL
  const mockUrl = `https://images.unsplash.com/photo-1557683316-973673baf926?w=${width}&h=${height}&fit=crop`;
  
  return {
    url: mockUrl,
    width,
    height
  };
};

// Video Generation Provider (Mock)
export const generateVideo = async (params: VideoGenerationParams, provider: ProviderType = 'runway'): Promise<{ url: string; duration: number; thumbnail: string }> => {
  console.log(`[Mock ${provider}] Generating video...`, params);
  await delay(8000 + Math.random() * 4000);

  const duration = params.duration || 5;
  
  return {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration,
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=450&fit=crop'
  };
};

// Audio Generation Provider (Mock)
export const generateAudio = async (params: AudioGenerationParams, provider: ProviderType = 'elevenlabs'): Promise<{ url: string; duration: number }> => {
  console.log(`[Mock ${provider}] Generating audio...`, params);
  await delay(3000 + Math.random() * 2000);

  const duration = params.text.split(' ').length * 0.5; // Rough estimate
  
  return {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration
  };
};

// Credit cost estimation
export const estimateCredits = (jobType: string, params: any): number => {
  switch (jobType) {
    case 'text_generation':
      return 1;
    case 'image_generation':
      const pixelCount = (params.width || 1024) * (params.height || 1024);
      return pixelCount > 1000000 ? 10 : pixelCount > 500000 ? 5 : 3;
    case 'video_generation':
      return Math.ceil((params.duration || 5) * 10);
    case 'audio_generation':
      return Math.ceil((params.text?.split(' ').length || 100) / 50);
    default:
      return 1;
  }
};
