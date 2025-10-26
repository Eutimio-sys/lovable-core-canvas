// Social Adapter Layer (SAL) - Mock provider adapters for social media platforms

export type SocialProvider = 'facebook_ig' | 'x' | 'linkedin' | 'tiktok';

export interface PublishPayload {
  text: string;
  mediaUrls?: string[];
  link?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface PublishResult {
  success: boolean;
  publishId?: string;
  url?: string;
  error?: string;
  provider: SocialProvider;
  timestamp: string;
}

export interface ProviderAdapter {
  publish(channelId: string, payload: PublishPayload): Promise<PublishResult>;
  getStatus(publishId: string): Promise<{ status: string; url?: string }>;
}

// Mock Facebook/Instagram adapter
class FacebookIGAdapter implements ProviderAdapter {
  async publish(channelId: string, payload: PublishPayload): Promise<PublishResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock publish
    const publishId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      publishId,
      url: `https://facebook.com/posts/${publishId}`,
      provider: 'facebook_ig',
      timestamp: new Date().toISOString(),
    };
  }

  async getStatus(publishId: string) {
    return { status: 'published', url: `https://facebook.com/posts/${publishId}` };
  }
}

// Mock X (Twitter) adapter
class XAdapter implements ProviderAdapter {
  async publish(channelId: string, payload: PublishPayload): Promise<PublishResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const publishId = `x_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      publishId,
      url: `https://x.com/post/${publishId}`,
      provider: 'x',
      timestamp: new Date().toISOString(),
    };
  }

  async getStatus(publishId: string) {
    return { status: 'published', url: `https://x.com/post/${publishId}` };
  }
}

// Mock LinkedIn adapter
class LinkedInAdapter implements ProviderAdapter {
  async publish(channelId: string, payload: PublishPayload): Promise<PublishResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const publishId = `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      publishId,
      url: `https://linkedin.com/posts/${publishId}`,
      provider: 'linkedin',
      timestamp: new Date().toISOString(),
    };
  }

  async getStatus(publishId: string) {
    return { status: 'published', url: `https://linkedin.com/posts/${publishId}` };
  }
}

// Mock TikTok adapter
class TikTokAdapter implements ProviderAdapter {
  async publish(channelId: string, payload: PublishPayload): Promise<PublishResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const publishId = `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      publishId,
      url: `https://tiktok.com/@user/video/${publishId}`,
      provider: 'tiktok',
      timestamp: new Date().toISOString(),
    };
  }

  async getStatus(publishId: string) {
    return { status: 'published', url: `https://tiktok.com/@user/video/${publishId}` };
  }
}

// SAL Factory
export class SocialAdapterLayer {
  private adapters: Map<SocialProvider, ProviderAdapter> = new Map([
    ['facebook_ig', new FacebookIGAdapter()],
    ['x', new XAdapter()],
    ['linkedin', new LinkedInAdapter()],
    ['tiktok', new TikTokAdapter()],
  ]);

  async publish(
    provider: SocialProvider,
    channelId: string,
    payload: PublishPayload
  ): Promise<PublishResult> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Provider ${provider} not supported`);
    }

    try {
      return await adapter.publish(channelId, payload);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getStatus(provider: SocialProvider, publishId: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Provider ${provider} not supported`);
    }

    return await adapter.getStatus(publishId);
  }
}

export const SAL = new SocialAdapterLayer();

// Mock OAuth connection
export async function mockOAuthConnect(
  provider: SocialProvider,
  workspaceId: string
): Promise<{ channelId: string; accountName: string; accountId: string }> {
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockAccounts = {
    facebook_ig: { accountName: '@mybrand_official', accountId: 'fb_12345' },
    x: { accountName: '@mybrand', accountId: 'x_67890' },
    linkedin: { accountName: 'MyBrand Company', accountId: 'li_54321' },
    tiktok: { accountName: '@mybrand_tt', accountId: 'tt_98765' },
  };

  return {
    channelId: `${provider}_${Date.now()}`,
    ...mockAccounts[provider],
  };
}
