// API Management and Social Media Platform Integration
class SocialMediaAPI {
  constructor() {
    this.platforms = {
      facebook: {
        connected: false,
        accessToken: null,
        pageId: null,
        apiVersion: 'v18.0'
      },
      instagram: {
        connected: false,
        accessToken: null,
        userId: null,
        apiVersion: 'v18.0'
      },
      youtube: {
        connected: false,
        accessToken: null,
        channelId: null,
        apiKey: null
      }
    };
    
    this.loadStoredCredentials();
  }

  // Load stored credentials from localStorage
  loadStoredCredentials() {
    const stored = localStorage.getItem('supernova_credentials');
    if (stored) {
      try {
        const credentials = JSON.parse(stored);
        this.platforms = { ...this.platforms, ...credentials };
      } catch (error) {
        console.error('Error loading stored credentials:', error);
      }
    }
  }

  // Save credentials to localStorage
  saveCredentials() {
    localStorage.setItem('supernova_credentials', JSON.stringify(this.platforms));
  }

  // Facebook Integration
  async connectFacebook(accessToken, pageId) {
    try {
      // Validate token by making a test request
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      
      if (response.ok) {
        this.platforms.facebook.connected = true;
        this.platforms.facebook.accessToken = accessToken;
        this.platforms.facebook.pageId = pageId;
        this.saveCredentials();
        return { success: true, message: 'Facebook connected successfully!' };
      } else {
        throw new Error('Invalid Facebook access token');
      }
    } catch (error) {
      console.error('Facebook connection error:', error);
      return { success: false, message: 'Failed to connect Facebook: ' + error.message };
    }
  }

  // Instagram Integration
  async connectInstagram(accessToken, userId) {
    try {
      // Validate token by making a test request
      const response = await fetch(`https://graph.instagram.com/v18.0/me?access_token=${accessToken}`);
      
      if (response.ok) {
        this.platforms.instagram.connected = true;
        this.platforms.instagram.accessToken = accessToken;
        this.platforms.instagram.userId = userId;
        this.saveCredentials();
        return { success: true, message: 'Instagram connected successfully!' };
      } else {
        throw new Error('Invalid Instagram access token');
      }
    } catch (error) {
      console.error('Instagram connection error:', error);
      return { success: false, message: 'Failed to connect Instagram: ' + error.message };
    }
  }

  // YouTube Integration
  async connectYouTube(accessToken, channelId, apiKey) {
    try {
      // Validate token by making a test request
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}&key=${apiKey}`);
      
      if (response.ok) {
        this.platforms.youtube.connected = true;
        this.platforms.youtube.accessToken = accessToken;
        this.platforms.youtube.channelId = channelId;
        this.platforms.youtube.apiKey = apiKey;
        this.saveCredentials();
        return { success: true, message: 'YouTube connected successfully!' };
      } else {
        throw new Error('Invalid YouTube credentials');
      }
    } catch (error) {
      console.error('YouTube connection error:', error);
      return { success: false, message: 'Failed to connect YouTube: ' + error.message };
    }
  }

  // Disconnect platform
  disconnectPlatform(platform) {
    if (this.platforms[platform]) {
      this.platforms[platform].connected = false;
      this.platforms[platform].accessToken = null;
      this.platforms[platform].pageId = null;
      this.platforms[platform].userId = null;
      this.platforms[platform].channelId = null;
      this.platforms[platform].apiKey = null;
      this.saveCredentials();
      return { success: true, message: `${platform} disconnected successfully!` };
    }
    return { success: false, message: 'Platform not found' };
  }

  // Fetch Facebook Comments
  async fetchFacebookComments() {
    if (!this.platforms.facebook.connected) {
      throw new Error('Facebook not connected');
    }

    try {
      const { accessToken, pageId } = this.platforms.facebook;
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=comments{message,from,created_time,id}&access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatFacebookComments(data);
    } catch (error) {
      console.error('Error fetching Facebook comments:', error);
      throw error;
    }
  }

  // Fetch Instagram Comments
  async fetchInstagramComments() {
    if (!this.platforms.instagram.connected) {
      throw new Error('Instagram not connected');
    }

    try {
      const { accessToken, userId } = this.platforms.instagram;
      const response = await fetch(`https://graph.instagram.com/v18.0/${userId}/media?fields=comments{text,username,timestamp,id}&access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatInstagramComments(data);
    } catch (error) {
      console.error('Error fetching Instagram comments:', error);
      throw error;
    }
  }

  // Fetch YouTube Comments
  async fetchYouTubeComments() {
    if (!this.platforms.youtube.connected) {
      throw new Error('YouTube not connected');
    }

    try {
      const { accessToken, channelId, apiKey } = this.platforms.youtube;
      const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&access_token=${accessToken}&key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatYouTubeComments(data);
    } catch (error) {
      console.error('Error fetching YouTube comments:', error);
      throw error;
    }
  }

  // Format Facebook comments to match app structure
  formatFacebookComments(data) {
    const comments = [];
    if (data.data) {
      data.data.forEach(post => {
        if (post.comments && post.comments.data) {
          post.comments.data.forEach((comment, index) => {
            comments.push({
              id: `fb_${comment.id}`,
              platform: 'facebook',
              text: comment.message || '',
              author: comment.from ? comment.from.name : 'Unknown',
              sentiment: this.analyzeSentiment(comment.message || ''),
              category: this.categorizeComment(comment.message || ''),
              priority: this.determinePriority(comment.message || ''),
              timestamp: comment.created_time || new Date().toISOString(),
              responded: false,
              originalId: comment.id
            });
          });
        }
      });
    }
    return comments;
  }

  // Format Instagram comments to match app structure
  formatInstagramComments(data) {
    const comments = [];
    if (data.data) {
      data.data.forEach(media => {
        if (media.comments && media.comments.data) {
          media.comments.data.forEach((comment, index) => {
            comments.push({
              id: `ig_${comment.id}`,
              platform: 'instagram',
              text: comment.text || '',
              author: comment.username || 'Unknown',
              sentiment: this.analyzeSentiment(comment.text || ''),
              category: this.categorizeComment(comment.text || ''),
              priority: this.determinePriority(comment.text || ''),
              timestamp: comment.timestamp || new Date().toISOString(),
              responded: false,
              originalId: comment.id
            });
          });
        }
      });
    }
    return comments;
  }

  // Format YouTube comments to match app structure
  formatYouTubeComments(data) {
    const comments = [];
    if (data.items) {
      data.items.forEach(thread => {
        const comment = thread.snippet.topLevelComment.snippet;
        comments.push({
          id: `yt_${thread.id}`,
          platform: 'youtube',
          text: comment.textDisplay || '',
          author: comment.authorDisplayName || 'Unknown',
          sentiment: this.analyzeSentiment(comment.textDisplay || ''),
          category: this.categorizeComment(comment.textDisplay || ''),
          priority: this.determinePriority(comment.textDisplay || ''),
          timestamp: comment.publishedAt || new Date().toISOString(),
          responded: false,
          originalId: thread.id
        });
      });
    }
    return comments;
  }

  // Simple sentiment analysis
  analyzeSentiment(text) {
    const positiveWords = ['love', 'great', 'awesome', 'amazing', 'excellent', 'perfect', 'good', 'wonderful', 'fantastic', 'best'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disgusting', 'useless', 'disappointed', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return Math.random() * 0.5 + 0.3; // 0.3 to 0.8
    if (negativeCount > positiveCount) return -(Math.random() * 0.5 + 0.3); // -0.3 to -0.8
    return (Math.random() - 0.5) * 0.4; // -0.2 to 0.2
  }

  // Categorize comments
  categorizeComment(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('refund') || lower.includes('money back') || lower.includes('return')) {
      return 'refunds';
    }
    if (lower.includes('question') || lower.includes('how') || lower.includes('when') || lower.includes('?')) {
      return 'questions';
    }
    if (lower.includes('thank') || lower.includes('love') || lower.includes('great') || lower.includes('awesome')) {
      return 'feedback';
    }
    
    return 'general';
  }

  // Determine priority
  determinePriority(text) {
    const lower = text.toLowerCase();
    const urgentWords = ['urgent', 'immediately', 'asap', 'emergency', 'terrible', 'awful', 'hate', 'angry'];
    const mediumWords = ['question', 'help', 'issue', 'problem', 'when', 'how'];
    
    if (urgentWords.some(word => lower.includes(word))) {
      return 'high';
    }
    if (mediumWords.some(word => lower.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  }

  // Reply to comment
  async replyToComment(commentId, platform, replyText) {
    try {
      switch (platform) {
        case 'facebook':
          return await this.replyToFacebookComment(commentId, replyText);
        case 'instagram':
          return await this.replyToInstagramComment(commentId, replyText);
        case 'youtube':
          return await this.replyToYouTubeComment(commentId, replyText);
        default:
          throw new Error('Unsupported platform');
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }

  // Reply to Facebook comment
  async replyToFacebookComment(commentId, replyText) {
    const { accessToken } = this.platforms.facebook;
    const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: replyText,
        access_token: accessToken
      })
    });

    if (!response.ok) {
      throw new Error(`Facebook reply error: ${response.status}`);
    }

    return await response.json();
  }

  // Reply to Instagram comment
  async replyToInstagramComment(commentId, replyText) {
    const { accessToken } = this.platforms.instagram;
    const response = await fetch(`https://graph.instagram.com/v18.0/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: replyText,
        access_token: accessToken
      })
    });

    if (!response.ok) {
      throw new Error(`Instagram reply error: ${response.status}`);
    }

    return await response.json();
  }

  // Reply to YouTube comment
  async replyToYouTubeComment(commentId, replyText) {
    const { accessToken, apiKey } = this.platforms.youtube;
    const response = await fetch(`https://www.googleapis.com/youtube/v3/comments?part=snippet&access_token=${accessToken}&key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          parentId: commentId,
          textOriginal: replyText
        }
      })
    });

    if (!response.ok) {
      throw new Error(`YouTube reply error: ${response.status}`);
    }

    return await response.json();
  }

  // Get platform connection status
  getPlatformStatus(platform) {
    return this.platforms[platform] || { connected: false };
  }

  // Get all connected platforms
  getConnectedPlatforms() {
    return Object.keys(this.platforms).filter(platform => this.platforms[platform].connected);
  }

  // Fetch all comments from connected platforms
  async fetchAllComments() {
    const allComments = [];
    const connectedPlatforms = this.getConnectedPlatforms();

    for (const platform of connectedPlatforms) {
      try {
        let comments = [];
        switch (platform) {
          case 'facebook':
            comments = await this.fetchFacebookComments();
            break;
          case 'instagram':
            comments = await this.fetchInstagramComments();
            break;
          case 'youtube':
            comments = await this.fetchYouTubeComments();
            break;
        }
        allComments.push(...comments);
      } catch (error) {
        console.error(`Error fetching ${platform} comments:`, error);
      }
    }

    return allComments;
  }
}

// Export for use in main app
window.SocialMediaAPI = SocialMediaAPI;