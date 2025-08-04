// API Management and Social Media Platform Integration
class SocialMediaAPI {
  constructor() {
    this.platforms = {
      facebook: {
        accounts: [],
        apiVersion: 'v18.0'
      },
      instagram: {
        accounts: [],
        apiVersion: 'v18.0'
      },
      youtube: {
        accounts: []
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
  async connectFacebook(accessToken, pageId, accountName = null) {
    try {
      console.log('Attempting Facebook connection with token and page ID...');
      
      // First validate the access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      
      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.json().catch(() => ({}));
        console.error('Facebook token validation failed:', tokenError);
        throw new Error(`Invalid Facebook access token: ${tokenError.error?.message || 'Token validation failed'}`);
      }
      
      // Validate the page ID and access permissions
      const pageResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name,access_token&access_token=${accessToken}`);
      
      if (!pageResponse.ok) {
        const pageError = await pageResponse.json().catch(() => ({}));
        console.error('Facebook page validation failed:', pageError);
        
        if (pageResponse.status === 404) {
          throw new Error('Facebook page not found. Please check your Page ID.');
        } else if (pageResponse.status === 403) {
          throw new Error('Access denied to Facebook page. Please ensure you have admin access and the correct permissions.');
        } else {
          throw new Error(`Facebook page validation failed: ${pageError.error?.message || 'Unable to access page'}`);
        }
      }
      
      const pageData = await pageResponse.json();
      console.log('Facebook page validation successful:', pageData.name);
      
      // Test fetching comments to ensure we have the right permissions
      try {
        const testResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=comments.limit(1)&access_token=${accessToken}`);
        if (!testResponse.ok) {
          const testError = await testResponse.json().catch(() => ({}));
          console.warn('Facebook comments test failed:', testError);
          throw new Error('Unable to access Facebook page comments. Please ensure your access token has the required permissions (pages_read_engagement, pages_manage_posts).');
        }
      } catch (permError) {
        console.error('Facebook permissions test failed:', permError);
        throw permError;
      }
      
      this.platforms.facebook.connected = true;
      this.platforms.facebook.accessToken = accessToken;
      this.platforms.facebook.pageId = pageId;
      this.platforms.facebook.lastSync = new Date().toISOString();
      this.saveCredentials();
      
      // Add to accounts array
      const accountId = `fb_${Date.now()}`;
      const newAccount = {
        id: accountId,
        name: accountName || pageData.name,
        pageName: pageData.name,
        connected: true,
        accessToken: accessToken,
        pageId: pageId,
        lastSync: new Date().toISOString()
      };
      
      // Check if account already exists
      const existingIndex = this.platforms.facebook.accounts.findIndex(acc => acc.pageId === pageId);
      if (existingIndex >= 0) {
        this.platforms.facebook.accounts[existingIndex] = newAccount;
      } else {
        this.platforms.facebook.accounts.push(newAccount);
      }
      
      this.saveCredentials();
      
      console.log('Facebook connected successfully');
      return { success: true, message: `Facebook connected successfully! Page: ${pageData.name}`, accountId };
    } catch (error) {
      console.error('Facebook connection error:', error);
      return { success: false, message: error.message };
    }
  }

  // Instagram Integration
  async connectInstagram(accessToken, userId, accountName = null) {
    try {
      console.log('Attempting Instagram connection...');
      
      // Validate token and user ID
      const response = await fetch(`https://graph.instagram.com/v18.0/${userId}?fields=id,username&access_token=${accessToken}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Instagram validation failed:', errorData);
        
        if (response.status === 404) {
          throw new Error('Instagram user not found. Please check your User ID.');
        } else if (response.status === 403) {
          throw new Error('Access denied to Instagram account. Please ensure you have the correct permissions.');
        } else {
          throw new Error(`Instagram validation failed: ${errorData.error?.message || 'Invalid credentials'}`);
        }
      }
      
      const userData = await response.json();
      console.log('Instagram validation successful:', userData.username);
      
      // Add to accounts array
      const accountId = `ig_${Date.now()}`;
      const newAccount = {
        id: accountId,
        name: accountName || `@${userData.username}`,
        username: userData.username,
        connected: true,
        accessToken: accessToken,
        userId: userId,
        lastSync: new Date().toISOString()
      };
      
      // Check if account already exists
      const existingIndex = this.platforms.instagram.accounts.findIndex(acc => acc.userId === userId);
      if (existingIndex >= 0) {
        this.platforms.instagram.accounts[existingIndex] = newAccount;
      } else {
        this.platforms.instagram.accounts.push(newAccount);
      }
      
      this.saveCredentials();
      
      return { success: true, message: `Instagram connected successfully! Account: @${userData.username}`, accountId };
    } catch (error) {
      console.error('Instagram connection error:', error);
      return { success: false, message: error.message };
    }
  }

  // YouTube Integration
  async connectYouTube(accessToken, channelId, apiKey, accountName = null) {
    try {
      console.log('Attempting YouTube connection...');
      
      // Validate the channel ID first
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`);
      
      if (!channelResponse.ok) {
        const channelError = await channelResponse.json().catch(() => ({}));
        console.error('YouTube channel validation failed:', channelError);
        throw new Error(`Invalid YouTube API key or channel ID: ${channelError.error?.message || 'Channel not found'}`);
      }
      
      const channelData = await channelResponse.json();
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('YouTube channel not found. Please check your Channel ID.');
      }
      
      // Validate access token with the specific channel
      const authResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}&key=${apiKey}`);
      
      if (!authResponse.ok) {
        const authError = await authResponse.json().catch(() => ({}));
        console.error('YouTube token validation failed:', authError);
        
        if (authResponse.status === 401) {
          throw new Error('Invalid or expired YouTube access token. Please re-authenticate.');
        } else {
          throw new Error(`YouTube authentication failed: ${authError.error?.message || 'Invalid token'}`);
        }
      }
      
      const authData = await authResponse.json();
      const userChannel = authData.items?.[0];
      
      if (!userChannel || userChannel.id !== channelId) {
        throw new Error('The provided Channel ID does not match your authenticated YouTube account.');
      }
      
      console.log('YouTube validation successful:', channelData.items[0].snippet.title);
      
      // Add to accounts array
      const accountId = `yt_${Date.now()}`;
      const newAccount = {
        id: accountId,
        name: accountName || channelData.items[0].snippet.title,
        channelTitle: channelData.items[0].snippet.title,
        connected: true,
        accessToken: accessToken,
        channelId: channelId,
        apiKey: apiKey,
        lastSync: new Date().toISOString()
      };
      
      // Check if account already exists
      const existingIndex = this.platforms.youtube.accounts.findIndex(acc => acc.channelId === channelId);
      if (existingIndex >= 0) {
        this.platforms.youtube.accounts[existingIndex] = newAccount;
      } else {
        this.platforms.youtube.accounts.push(newAccount);
      }
      
      this.saveCredentials();
      
      return { success: true, message: `YouTube connected successfully! Channel: ${channelData.items[0].snippet.title}`, accountId };
    } catch (error) {
      console.error('YouTube connection error:', error);
      return { success: false, message: error.message };
    }
  }

  // Disconnect platform account
  disconnectPlatform(platform, accountId = null) {
    if (this.platforms[platform]) {
      if (accountId) {
        // Disconnect specific account
        const accountIndex = this.platforms[platform].accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex >= 0) {
          const accountName = this.platforms[platform].accounts[accountIndex].name;
          this.platforms[platform].accounts.splice(accountIndex, 1);
          this.saveCredentials();
          return { success: true, message: `${accountName} disconnected successfully!` };
        }
        return { success: false, message: 'Account not found' };
      } else {
        // Disconnect all accounts for platform
        const accountCount = this.platforms[platform].accounts.length;
        this.platforms[platform].accounts = [];
        this.saveCredentials();
        return { success: true, message: `All ${accountCount} ${platform} accounts disconnected successfully!` };
      }
    }
    return { success: false, message: 'Platform not found' };
  }

  // Fetch Facebook Comments from all connected accounts
  async fetchFacebookComments() {
    const facebookAccounts = this.platforms.facebook.accounts.filter(acc => acc.connected);
    if (facebookAccounts.length === 0) {
      throw new Error('No Facebook accounts connected');
    }
    
    const allComments = [];
    
    for (const account of facebookAccounts) {

      try {
        console.log(`Fetching Facebook comments for ${account.name}...`);
        const { accessToken, pageId } = account;
      const allComments = [];
      
      // 1. Fetch comments from page posts
      console.log('Fetching comments from page posts...');
      const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,permalink_url,message,comments{id,message,from,created_time,permalink_url}&access_token=${accessToken}`);
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.json().catch(() => ({}));
        console.error('Facebook posts API error:', errorData);
        
        if (postsResponse.status === 401) {
          this.platforms.facebook.connected = false;
          this.saveCredentials();
          throw new Error('Facebook access token expired. Please reconnect your account.');
        } else if (postsResponse.status === 403) {
          throw new Error('Access denied to Facebook page. Please check your permissions.');
        } else if (postsResponse.status === 404) {
          throw new Error('Facebook page not found. Please check your Page ID.');
        } else {
          throw new Error(`Facebook API error: ${errorData.error?.message || postsResponse.status}`);
        }
      }

      const postsData = await postsResponse.json();
      console.log(`Found ${postsData.data?.length || 0} posts with comments`);
      
      // Format post comments
      if (postsData.data) {
        postsData.data.forEach(post => {
          if (post.comments && post.comments.data) {
            post.comments.data.forEach(comment => {
              allComments.push({
                id: `fb_post_${comment.id}`,
                platform: 'facebook',
                text: comment.message || '',
                author: comment.from ? comment.from.name : 'Unknown',
                sentiment: this.analyzeSentiment(comment.message || ''),
                category: this.categorizeComment(comment.message || ''),
                priority: this.determinePriority(comment.message || ''),
                timestamp: comment.created_time || new Date().toISOString(),
                responded: false,
                originalId: comment.id,
                postId: post.id,
                postUrl: post.permalink_url,
                commentUrl: comment.permalink_url,
                type: 'post_comment'
              });
            });
          }
        });
      }
      
      // 2. Fetch comments on the page itself (visitor posts)
      console.log('Fetching visitor posts and comments...');
      try {
        const visitorPostsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/visitor_posts?fields=id,permalink_url,message,comments{id,message,from,created_time,permalink_url}&access_token=${accessToken}`);
        
        if (visitorPostsResponse.ok) {
          const visitorData = await visitorPostsResponse.json();
          console.log(`Found ${visitorData.data?.length || 0} visitor posts`);
          
          if (visitorData.data) {
            visitorData.data.forEach(post => {
              if (post.comments && post.comments.data) {
                post.comments.data.forEach(comment => {
                  allComments.push({
                    id: `fb_visitor_${comment.id}`,
                    platform: 'facebook',
                    text: comment.message || '',
                    author: comment.from ? comment.from.name : 'Unknown',
                    sentiment: this.analyzeSentiment(comment.message || ''),
                    category: this.categorizeComment(comment.message || ''),
                    priority: this.determinePriority(comment.message || ''),
                    timestamp: comment.created_time || new Date().toISOString(),
                    responded: false,
                    originalId: comment.id,
                    postId: post.id,
                    postUrl: post.permalink_url,
                    commentUrl: comment.permalink_url,
                    type: 'visitor_comment'
                  });
                });
              }
            });
          }
        }
      } catch (visitorError) {
        console.warn('Could not fetch visitor posts:', visitorError.message);
      }
      
      // 3. Try to fetch ad comments (requires ads_read permission)
      console.log('Attempting to fetch ad comments...');
      try {
        const adAccountResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`);
        
        if (adAccountResponse.ok) {
          const adAccountData = await adAccountResponse.json();
          
          for (const adAccount of adAccountData.data || []) {
            const adsResponse = await fetch(`https://graph.facebook.com/v18.0/${adAccount.id}/ads?fields=id,name,creative{object_story_id}&access_token=${accessToken}`);
            
            if (adsResponse.ok) {
              const adsData = await adsResponse.json();
              
              for (const ad of adsData.data || []) {
                if (ad.creative && ad.creative.object_story_id) {
                  const adCommentsResponse = await fetch(`https://graph.facebook.com/v18.0/${ad.creative.object_story_id}/comments?fields=id,message,from,created_time,permalink_url&access_token=${accessToken}`);
                  
                  if (adCommentsResponse.ok) {
                    const adCommentsData = await adCommentsResponse.json();
                    
                    adCommentsData.data?.forEach(comment => {
                      allComments.push({
                        id: `fb_ad_${comment.id}`,
                        platform: 'facebook',
                        text: comment.message || '',
                        author: comment.from ? comment.from.name : 'Unknown',
                        sentiment: this.analyzeSentiment(comment.message || ''),
                        category: this.categorizeComment(comment.message || ''),
                        priority: this.determinePriority(comment.message || ''),
                        timestamp: comment.created_time || new Date().toISOString(),
                        responded: false,
                        originalId: comment.id,
                        postId: ad.creative.object_story_id,
                        adId: ad.id,
                        adName: ad.name,
                        commentUrl: comment.permalink_url,
                        type: 'ad_comment'
                      });
                    });
                  }
                }
              }
            }
          }
          
          console.log(`Total ad comments found: ${allComments.filter(c => c.type === 'ad_comment').length}`);
        }
      } catch (adError) {
        console.warn('Could not fetch ad comments (may need ads_read permission):', adError.message);
      }
      
      console.log(`Facebook sync successful: found ${allComments.length} total comments (${allComments.filter(c => c.type === 'post_comment').length} post, ${allComments.filter(c => c.type === 'visitor_comment').length} visitor, ${allComments.filter(c => c.type === 'ad_comment').length} ad)`);
      
      // Update last sync time
      this.platforms.facebook.lastSync = new Date().toISOString();
      this.saveCredentials();
      
      return allComments;
    } catch (error) {
      console.error('Error fetching Facebook comments:', error);
      
      // Update last sync attempt time even on failure
      this.platforms.facebook.lastSyncAttempt = new Date().toISOString();
      this.saveCredentials();
      
      throw error;
    }
  }

  // Fetch Instagram Comments
  async fetchInstagramComments() {
    if (!this.platforms.instagram.connected) {
      throw new Error('Instagram not connected');
    }

    try {
      console.log('Fetching Instagram comments...');
      const { accessToken, userId } = this.platforms.instagram;
      
      const response = await fetch(`https://graph.instagram.com/v18.0/${userId}/media?fields=comments{text,username,timestamp,id}&access_token=${accessToken}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Instagram API error:', errorData);
        
        if (response.status === 401) {
          this.platforms.instagram.connected = false;
          this.saveCredentials();
          throw new Error('Instagram access token expired. Please reconnect your account.');
        } else if (response.status === 403) {
          throw new Error('Access denied to Instagram account. Please check your permissions.');
        } else {
          throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
        }
      }

      const data = await response.json();
      console.log(`Instagram sync successful: found ${data.data?.length || 0} media posts`);
      
      // Update last sync time
      this.platforms.instagram.lastSync = new Date().toISOString();
      this.saveCredentials();
      
      return this.formatInstagramComments(data);
    } catch (error) {
      console.error('Error fetching Instagram comments:', error);
      
      // Update last sync attempt time even on failure
      this.platforms.instagram.lastSyncAttempt = new Date().toISOString();
      this.saveCredentials();
      
      throw error;
    }
  }

  // Fetch YouTube Comments
  async fetchYouTubeComments() {
    if (!this.platforms.youtube.connected) {
      throw new Error('YouTube not connected');
    }

    try {
      console.log('Fetching YouTube comments...');
      const { accessToken, channelId, apiKey } = this.platforms.youtube;
      
      const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&access_token=${accessToken}&key=${apiKey}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('YouTube API error:', errorData);
        
        if (response.status === 401) {
          this.platforms.youtube.connected = false;
          this.saveCredentials();
          throw new Error('YouTube access token expired. Please reconnect your account.');
        } else if (response.status === 403) {
          const errorReason = errorData.error?.errors?.[0]?.reason;
          if (errorReason === 'commentsDisabled') {
            throw new Error('Comments are disabled for this YouTube channel.');
          } else if (errorReason === 'quotaExceeded') {
            throw new Error('YouTube API quota exceeded. Please try again later.');
          } else {
            throw new Error('Access denied to YouTube comments. Please check your permissions.');
          }
        } else {
          throw new Error(`YouTube API error: ${errorData.error?.message || response.status}`);
        }
      }

      const data = await response.json();
      console.log(`YouTube sync successful: found ${data.items?.length || 0} comment threads`);
      
      // Update last sync time
      this.platforms.youtube.lastSync = new Date().toISOString();
      this.saveCredentials();
      
      return this.formatYouTubeComments(data);
    } catch (error) {
      console.error('Error fetching YouTube comments:', error);
      
      // Update last sync attempt time even on failure
      this.platforms.youtube.lastSyncAttempt = new Date().toISOString();
      this.saveCredentials();
      
      throw error;
    }
  }

  // Format Facebook comments to match app structure (deprecated - now handled in fetchFacebookComments)
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
              originalId: comment.id,
              postUrl: post.permalink_url,
              commentUrl: comment.permalink_url,
              type: 'post_comment'
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
    if (!this.platforms[platform]) {
      return { connected: false, accounts: [] };
    }
    
    const connectedAccounts = this.platforms[platform].accounts.filter(acc => acc.connected);
    return {
      connected: connectedAccounts.length > 0,
      accounts: this.platforms[platform].accounts,
      connectedAccounts: connectedAccounts,
      accountCount: connectedAccounts.length,
      lastSync: connectedAccounts.length > 0 ? Math.max(...connectedAccounts.map(acc => new Date(acc.lastSync || 0))) : null,
      lastSyncAttempt: connectedAccounts.length > 0 ? Math.max(...connectedAccounts.map(acc => new Date(acc.lastSyncAttempt || 0))) : null
    };
  }

  // Get all connected platforms
  getConnectedPlatforms() {
    return Object.keys(this.platforms).filter(platform => {
      const connectedAccounts = this.platforms[platform].accounts.filter(acc => acc.connected);
      return connectedAccounts.length > 0;
    });
  }

  // Get all connected accounts across platforms
  getAllConnectedAccounts() {
    const allAccounts = [];
    Object.keys(this.platforms).forEach(platform => {
      const connectedAccounts = this.platforms[platform].accounts.filter(acc => acc.connected);
      connectedAccounts.forEach(account => {
        allAccounts.push({
          ...account,
          platform: platform
        });
      });
    });
    return allAccounts;
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