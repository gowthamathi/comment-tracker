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
        // Merge credentials while ensuring accounts arrays exist
        Object.keys(credentials).forEach(platform => {
          if (this.platforms[platform]) {
            this.platforms[platform] = {
              ...this.platforms[platform],
              ...credentials[platform],
              accounts: credentials[platform].accounts || []
            };
          }
        });
      } catch (error) {
        console.error('Error loading stored credentials:', error);
      }
    }
    
    // Ensure all platforms have accounts arrays
    Object.keys(this.platforms).forEach(platform => {
      if (!this.platforms[platform].accounts) {
        this.platforms[platform].accounts = [];
      }
    });
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

  // Instagram Integration (using Instagram Graph API for Business accounts)
  async connectInstagram(accessToken, userId, accountName = null) {
    try {
      console.log('Attempting Instagram Business account connection...');
      
      // First, validate the access token by getting user info
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      
      if (!userResponse.ok) {
        const userError = await userResponse.json().catch(() => ({}));
        console.error('Facebook token validation failed:', userError);
        throw new Error(`Invalid access token: ${userError.error?.message || 'Token validation failed'}`);
      }
      
      // Get Instagram Business accounts connected to this Facebook account
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`);
      
      if (!pagesResponse.ok) {
        const pagesError = await pagesResponse.json().catch(() => ({}));
        console.error('Pages fetch failed:', pagesError);
        throw new Error(`Could not fetch Facebook pages: ${pagesError.error?.message || 'Pages access failed'}`);
      }
      
      const pagesData = await pagesResponse.json();
      console.log('Found Facebook pages:', pagesData.data?.length || 0);
      
      // Find Instagram Business accounts
      let instagramAccounts = [];
      if (pagesData.data) {
        pagesData.data.forEach(page => {
          if (page.instagram_business_account) {
            instagramAccounts.push({
              pageId: page.id,
              pageName: page.name,
              igId: page.instagram_business_account.id,
              igUsername: page.instagram_business_account.username,
              igName: page.instagram_business_account.name,
              profilePicture: page.instagram_business_account.profile_picture_url
            });
          }
        });
      }
      
      if (instagramAccounts.length === 0) {
        throw new Error('No Instagram Business accounts found. Please ensure you have:\n1. An Instagram Business account\n2. Connected it to a Facebook Page\n3. Proper permissions (instagram_basic, pages_read_engagement)');
      }
      
      // If userId is provided, find that specific account
      let selectedAccount = null;
      if (userId) {
        selectedAccount = instagramAccounts.find(acc => acc.igId === userId);
        if (!selectedAccount) {
          throw new Error(`Instagram Business account with ID ${userId} not found. Available accounts: ${instagramAccounts.map(acc => `${acc.igUsername} (${acc.igId})`).join(', ')}`);
        }
      } else {
        // Use the first account if no specific ID provided
        selectedAccount = instagramAccounts[0];
      }
      
      console.log('Instagram validation successful:', selectedAccount.igUsername);
      
      // Test permissions by trying to fetch media
      try {
        const testResponse = await fetch(`https://graph.facebook.com/v18.0/${selectedAccount.igId}/media?fields=id,media_type&limit=1&access_token=${accessToken}`);
        if (!testResponse.ok) {
          const testError = await testResponse.json().catch(() => ({}));
          throw new Error(`Instagram API test failed: ${testError.error?.message || 'Permission denied'}. Please ensure you have instagram_basic and instagram_manage_comments permissions.`);
        }
      } catch (permError) {
        console.error('Instagram permissions test failed:', permError);
        throw new Error(`Instagram permissions test failed: ${permError.message}`);
      }
      
      // Add to accounts array
      const accountId = `ig_${Date.now()}`;
      const newAccount = {
        id: accountId,
        name: accountName || `@${selectedAccount.igUsername}`,
        username: selectedAccount.igUsername,
        displayName: selectedAccount.igName,
        connected: true,
        accessToken: accessToken,
        userId: selectedAccount.igId,
        pageId: selectedAccount.pageId,
        pageName: selectedAccount.pageName,
        profilePicture: selectedAccount.profilePicture,
        lastSync: new Date().toISOString()
      };
      
      // Check if account already exists
      const existingIndex = this.platforms.instagram.accounts.findIndex(acc => acc.userId === selectedAccount.igId);
      if (existingIndex >= 0) {
        this.platforms.instagram.accounts[existingIndex] = newAccount;
      } else {
        this.platforms.instagram.accounts.push(newAccount);
      }
      
      this.saveCredentials();
      
      const availableAccountsMsg = instagramAccounts.length > 1 ? ` (${instagramAccounts.length} accounts available)` : '';
      return { 
        success: true, 
        message: `Instagram Business account connected successfully! Account: @${selectedAccount.igUsername}${availableAccountsMsg}`, 
        accountId,
        availableAccounts: instagramAccounts
      };
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

  // Helper method to fetch ad comments with detailed debugging
  async fetchAdComments(storyId, ad, accessToken, allComments, account, pageId) {
    try {
      console.log(`🔍 Fetching comments for story ${storyId} (ad: ${ad.name || ad.id})...`);
      const adCommentsResponse = await fetch(`https://graph.facebook.com/v18.0/${storyId}/comments?fields=id,message,from,created_time,permalink_url,like_count&access_token=${accessToken}`);
      
      console.log(`Ad comments response status: ${adCommentsResponse.status}`);
      if (adCommentsResponse.ok) {
        const adCommentsData = await adCommentsResponse.json();
        console.log(`Ad comments response:`, JSON.stringify(adCommentsData, null, 2));
        
        const commentsBefore = allComments.length;
        adCommentsData.data?.forEach(comment => {
          console.log(`Adding ad comment: ${comment.message?.substring(0, 50)}... by ${comment.from?.name}`);
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
            postId: storyId,
            adId: ad.id,
            adName: ad.name,
            commentUrl: comment.permalink_url,
            type: 'ad_comment',
            pageId: pageId,
            accountId: account.id,
            accountName: account.name,
            likeCount: comment.like_count || 0
          });
        });
        
        const commentsAdded = allComments.length - commentsBefore;
        console.log(`✅ Successfully added ${commentsAdded} comments for ad ${ad.name || ad.id} (story ${storyId})`);
        return commentsAdded;
      } else {
        const errorText = await adCommentsResponse.text();
        console.log(`❌ Could not fetch comments for ad ${ad.id} (story ${storyId}):`, adCommentsResponse.status, errorText);
        return 0;
      }
    } catch (error) {
      console.log(`❌ Exception fetching comments for ad ${ad.id} (story ${storyId}):`, error.message);
      return 0;
    }
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
        
        // 1. Fetch comments from page posts
        console.log('Fetching comments from page posts...');
        try {
          const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,permalink_url,message,comments{id,message,from,created_time,permalink_url}&access_token=${accessToken}`);
          
          if (postsResponse.ok) {
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
                      type: 'post_comment',
                      pageId: pageId,
                      accountId: account.id,
                      accountName: account.name
                    });
                  });
                }
              });
            }
          } else {
            const errorData = await postsResponse.json().catch(() => ({}));
            console.error('Facebook posts API error:', errorData);
            
            if (postsResponse.status === 401) {
              account.connected = false;
              this.saveCredentials();
              throw new Error('Facebook access token expired. Please reconnect your account.');
            }
          }
        } catch (postsError) {
          console.error('Error fetching page posts:', postsError.message);
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
                      type: 'visitor_comment',
                      pageId: pageId,
                      accountId: account.id,
                      accountName: account.name
                    });
                  });
                }
              });
            }
          }
        } catch (visitorError) {
          console.warn('Could not fetch visitor posts:', visitorError.message);
        }
        
        // 3. Fetch ad comments using multiple approaches with detailed debugging
        console.log('=== STARTING AD COMMENTS FETCH ===');
        console.log(`Account: ${account.name}, Page ID: ${pageId}`);
        
        let totalAdComments = 0;
        try {
          // Method 1: Try to get ads directly associated with the page
          console.log('🔍 Method 1: Fetching ads directly from page...');
          try {
            const pageAdsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/ads?fields=id,name,status,creative{object_story_id,effective_object_story_id}&access_token=${accessToken}`);
            
            console.log(`Page ads response status: ${pageAdsResponse.status}`);
            if (pageAdsResponse.ok) {
              const pageAdsData = await pageAdsResponse.json();
              console.log(`✅ Found ${pageAdsData.data?.length || 0} ads directly from page`);
              console.log('Page ads data:', JSON.stringify(pageAdsData, null, 2));
              
              for (const ad of pageAdsData.data || []) {
                console.log(`Processing ad: ${ad.name || ad.id}, Status: ${ad.status}`);
                const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
                console.log(`Story ID for ad ${ad.id}: ${storyId}`);
                if (storyId) {
                  const commentsBefore = allComments.length;
                  await this.fetchAdComments(storyId, ad, accessToken, allComments, account, pageId);
                  const commentsAdded = allComments.length - commentsBefore;
                  totalAdComments += commentsAdded;
                  console.log(`✅ Added ${commentsAdded} comments from ad ${ad.name || ad.id}`);
                } else {
                  console.log(`⚠️ No story ID found for ad ${ad.id}`);
                }
              }
            } else {
              const errorText = await pageAdsResponse.text();
              console.log('❌ Page ads endpoint error:', pageAdsResponse.status, errorText);
            }
          } catch (pageAdsError) {
            console.log('❌ Page ads method exception:', pageAdsError.message);
          }
          
          // Method 2: Try ad accounts approach with detailed logging
          console.log('🔍 Method 2: Trying ad accounts approach...');
          try {
            const adAccountResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`);
            
            console.log(`Ad accounts response status: ${adAccountResponse.status}`);
            if (adAccountResponse.ok) {
              const adAccountData = await adAccountResponse.json();
              console.log(`✅ Found ${adAccountData.data?.length || 0} ad accounts`);
              console.log('Ad accounts:', JSON.stringify(adAccountData, null, 2));
              
              for (const adAccount of adAccountData.data || []) {
                console.log(`🔎 Checking ad account: ${adAccount.name || adAccount.id} (Status: ${adAccount.account_status})`);
                
                // Get ads from this ad account that might be related to this page
                const adsResponse = await fetch(`https://graph.facebook.com/v18.0/${adAccount.id}/ads?fields=id,name,status,creative{object_story_id,effective_object_story_id}&limit=50&access_token=${accessToken}`);
                
                console.log(`Ads response for account ${adAccount.id}: ${adsResponse.status}`);
                if (adsResponse.ok) {
                  const adsData = await adsResponse.json();
                  console.log(`✅ Found ${adsData.data?.length || 0} ads in account ${adAccount.name || adAccount.id}`);
                  
                  for (const ad of adsData.data || []) {
                    console.log(`Processing ad: ${ad.name || ad.id}, Status: ${ad.status}`);
                    const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
                    console.log(`Story ID for ad ${ad.id}: ${storyId}`);
                    if (storyId) {
                      // Check if this ad story is related to our page
                      try {
                        console.log(`Verifying story ${storyId} belongs to page ${pageId}...`);
                        const storyResponse = await fetch(`https://graph.facebook.com/v18.0/${storyId}?fields=from,id&access_token=${accessToken}`);
                        if (storyResponse.ok) {
                          const storyData = await storyResponse.json();
                          console.log(`Story data:`, JSON.stringify(storyData, null, 2));
                          if (storyData.from && storyData.from.id === pageId) {
                            console.log(`✅ Story ${storyId} belongs to our page! Fetching comments...`);
                            const commentsBefore = allComments.length;
                            await this.fetchAdComments(storyId, ad, accessToken, allComments, account, pageId);
                            const commentsAdded = allComments.length - commentsBefore;
                            totalAdComments += commentsAdded;
                            console.log(`✅ Added ${commentsAdded} comments from ad account ad ${ad.name || ad.id}`);
                          } else {
                            console.log(`⚠️ Story ${storyId} does not belong to our page (belongs to ${storyData.from?.id})`);
                          }
                        } else {
                          const storyErrorText = await storyResponse.text();
                          console.log(`❌ Could not fetch story ${storyId}:`, storyResponse.status, storyErrorText);
                        }
                      } catch (storyError) {
                        console.log(`❌ Exception verifying story ${storyId}:`, storyError.message);
                      }
                    } else {
                      console.log(`⚠️ No story ID found for ad ${ad.id}`);
                    }
                  }
                } else {
                  const adsErrorText = await adsResponse.text();
                  console.log(`❌ Could not fetch ads from account ${adAccount.id}:`, adsResponse.status, adsErrorText);
                }
              }
            } else {
              const adAccountErrorText = await adAccountResponse.text();
              console.log('❌ Could not fetch ad accounts:', adAccountResponse.status, adAccountErrorText);
            }
          } catch (adAccountError) {
            console.warn('❌ Ad accounts method exception:', adAccountError.message);
          }
          
          // Method 3: Try to get promoted posts (page posts that became ads)
          console.log('🔍 Method 3: Trying promoted posts approach...');
          try {
            const promotedPostsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/promotable_posts?fields=id,permalink_url,message,is_published&access_token=${accessToken}`);
            
            console.log(`Promoted posts response status: ${promotedPostsResponse.status}`);
            if (promotedPostsResponse.ok) {
              const promotedData = await promotedPostsResponse.json();
              console.log(`✅ Found ${promotedData.data?.length || 0} promotable posts`);
              console.log('Promoted posts data:', JSON.stringify(promotedData, null, 2));
              
              for (const post of promotedData.data || []) {
                console.log(`Processing promoted post: ${post.id}`);
                const commentsResponse = await fetch(`https://graph.facebook.com/v18.0/${post.id}/comments?fields=id,message,from,created_time,permalink_url&access_token=${accessToken}`);
                
                console.log(`Comments response for post ${post.id}: ${commentsResponse.status}`);
                if (commentsResponse.ok) {
                  const commentsData = await commentsResponse.json();
                  console.log(`✅ Found ${commentsData.data?.length || 0} comments on promoted post ${post.id}`);
                  
                  const commentsBefore = allComments.length;
                  commentsData.data?.forEach(comment => {
                    allComments.push({
                      id: `fb_promoted_${comment.id}`,
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
                      type: 'promoted_post_comment',
                      pageId: pageId,
                      accountId: account.id,
                      accountName: account.name
                    });
                  });
                  const commentsAdded = allComments.length - commentsBefore;
                  totalAdComments += commentsAdded;
                  console.log(`✅ Added ${commentsAdded} comments from promoted post ${post.id}`);
                } else {
                  const commentsErrorText = await commentsResponse.text();
                  console.log(`❌ Could not fetch comments for promoted post ${post.id}:`, commentsResponse.status, commentsErrorText);
                }
              }
            } else {
              const promotedErrorText = await promotedPostsResponse.text();
              console.log('❌ Promoted posts method error:', promotedPostsResponse.status, promotedErrorText);
            }
          } catch (promotedError) {
            console.log('❌ Promoted posts method exception:', promotedError.message);
          }
          
          console.log(`=== AD COMMENTS SUMMARY for ${account.name} ===`);
          console.log(`Total ad-related comments found: ${totalAdComments}`);
          const adCommentsCount = allComments.filter(c => (c.type === 'ad_comment' || c.type === 'promoted_post_comment') && c.accountId === account.id).length;
          console.log(`Verified count in array: ${adCommentsCount}`);
          console.log('=== END AD COMMENTS SUMMARY ===');
          
        } catch (adError) {
          console.error(`❌ All ad comment fetching methods failed for ${account.name}:`, adError.message);
        }
        
        // Update last sync time for this account
        account.lastSync = new Date().toISOString();
      } catch (error) {
        console.error(`Error fetching Facebook comments for ${account.name}:`, error);
        
        // Update last sync attempt time even on failure
        account.lastSyncAttempt = new Date().toISOString();
        
        // Mark account as disconnected if token expired
        if (error.message.includes('access token expired')) {
          account.connected = false;
        }
      }
    }
    
    this.saveCredentials();
    const postComments = allComments.filter(c => c.type === 'post_comment').length;
    const visitorComments = allComments.filter(c => c.type === 'visitor_comment').length;
    const adComments = allComments.filter(c => c.type === 'ad_comment' || c.type === 'promoted_post_comment').length;
    
    console.log(`Facebook sync completed: found ${allComments.length} total comments from ${facebookAccounts.length} accounts (${postComments} post, ${visitorComments} visitor, ${adComments} ad)`);
    
    return allComments;
  }

  // Fetch Instagram Comments from all connected accounts (using Instagram Graph API)
  async fetchInstagramComments() {
    const instagramAccounts = this.platforms.instagram.accounts.filter(acc => acc.connected);
    if (instagramAccounts.length === 0) {
      throw new Error('No Instagram accounts connected');
    }
    
    const allComments = [];
    
    for (const account of instagramAccounts) {
      try {
        console.log(`Fetching Instagram comments for ${account.name}...`);
        const { accessToken, userId } = account;
        
        // Use Instagram Graph API (Facebook Graph API for Instagram Business)
        const response = await fetch(`https://graph.facebook.com/v18.0/${userId}/media?fields=id,media_type,media_url,permalink,timestamp,caption,comments{id,text,username,timestamp,like_count,replies{id,text,username,timestamp}}&limit=50&access_token=${accessToken}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Instagram API error:', errorData);
          
          if (response.status === 401) {
            account.connected = false;
            this.saveCredentials();
            throw new Error('Instagram access token expired. Please reconnect your account.');
          } else if (response.status === 403) {
            throw new Error('Access denied to Instagram Business account. Please ensure you have instagram_basic and instagram_manage_comments permissions.');
          } else if (response.status === 400 && errorData.error?.code === 100) {
            throw new Error('Instagram Business account access failed. Please ensure your Instagram account is connected to a Facebook Page and has Business account status.');
          } else {
            throw new Error(`Instagram API error: ${errorData.error?.message || response.status}`);
          }
        }

        const data = await response.json();
        console.log(`Instagram sync for ${account.name}: found ${data.data?.length || 0} media posts`);
        
        // Format Instagram comments
        if (data.data) {
          data.data.forEach(media => {
            if (media.comments && media.comments.data) {
              media.comments.data.forEach(comment => {
                allComments.push({
                  id: `ig_${comment.id}`,
                  platform: 'instagram',
                  text: comment.text || '',
                  author: comment.username || 'Unknown',
                  sentiment: this.analyzeSentiment(comment.text || ''),
                  category: this.categorizeComment(comment.text || ''),
                  priority: this.determinePriority(comment.text || ''),
                  timestamp: comment.timestamp || new Date().toISOString(),
                  responded: false,
                  originalId: comment.id,
                  postId: media.id,
                  postUrl: media.permalink,
                  commentUrl: media.permalink, // Instagram doesn't provide direct comment URLs
                  type: 'media_comment',
                  accountId: account.id,
                  accountName: account.name,
                  likeCount: comment.like_count || 0
                });
                
                // Add replies as separate comments
                if (comment.replies && comment.replies.data) {
                  comment.replies.data.forEach(reply => {
                    allComments.push({
                      id: `ig_reply_${reply.id}`,
                      platform: 'instagram',
                      text: reply.text || '',
                      author: reply.username || 'Unknown',
                      sentiment: this.analyzeSentiment(reply.text || ''),
                      category: this.categorizeComment(reply.text || ''),
                      priority: this.determinePriority(reply.text || ''),
                      timestamp: reply.timestamp || new Date().toISOString(),
                      responded: false,
                      originalId: reply.id,
                      postId: media.id,
                      postUrl: media.permalink,
                      commentUrl: media.permalink,
                      type: 'reply_comment',
                      accountId: account.id,
                      accountName: account.name,
                      parentCommentId: comment.id
                    });
                  });
                }
              });
            }
          });
        }
        
        // Update last sync time
        account.lastSync = new Date().toISOString();
      } catch (error) {
        console.error(`Error fetching Instagram comments for ${account.name}:`, error);
        
        // Update last sync attempt time even on failure
        account.lastSyncAttempt = new Date().toISOString();
        
        // Mark account as disconnected if token expired
        if (error.message.includes('access token expired')) {
          account.connected = false;
        }
      }
    }
    
    this.saveCredentials();
    const commentCount = allComments.filter(c => c.type === 'media_comment').length;
    const replyCount = allComments.filter(c => c.type === 'reply_comment').length;
    console.log(`Instagram sync completed: found ${commentCount} comments and ${replyCount} replies from ${instagramAccounts.length} accounts`);
    
    return allComments;
  }

  // Fetch YouTube Comments from all connected accounts
  async fetchYouTubeComments() {
    const youtubeAccounts = this.platforms.youtube.accounts.filter(acc => acc.connected);
    if (youtubeAccounts.length === 0) {
      throw new Error('No YouTube accounts connected');
    }
    
    const allComments = [];
    
    for (const account of youtubeAccounts) {
      try {
        console.log(`Fetching YouTube comments for ${account.name}...`);
        const { accessToken, channelId, apiKey } = account;
        
        const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&access_token=${accessToken}&key=${apiKey}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('YouTube API error:', errorData);
          
          if (response.status === 401) {
            account.connected = false;
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
        console.log(`YouTube sync for ${account.name}: found ${data.items?.length || 0} comment threads`);
        
        // Format YouTube comments
        if (data.items) {
          data.items.forEach(thread => {
            const comment = thread.snippet.topLevelComment.snippet;
            allComments.push({
              id: `yt_${thread.id}`,
              platform: 'youtube',
              text: comment.textDisplay || '',
              author: comment.authorDisplayName || 'Unknown',
              sentiment: this.analyzeSentiment(comment.textDisplay || ''),
              category: this.categorizeComment(comment.textDisplay || ''),
              priority: this.determinePriority(comment.textDisplay || ''),
              timestamp: comment.publishedAt || new Date().toISOString(),
              responded: false,
              originalId: thread.id,
              videoId: comment.videoId,
              commentUrl: `https://www.youtube.com/watch?v=${comment.videoId}&lc=${thread.id}`,
              postUrl: `https://www.youtube.com/watch?v=${comment.videoId}`,
              type: 'video_comment',
              accountId: account.id,
              accountName: account.name
            });
          });
        }
        
        // Update last sync time
        account.lastSync = new Date().toISOString();
      } catch (error) {
        console.error(`Error fetching YouTube comments for ${account.name}:`, error);
        
        // Update last sync attempt time even on failure
        account.lastSyncAttempt = new Date().toISOString();
        
        // Mark account as disconnected if token expired
        if (error.message.includes('access token expired')) {
          account.connected = false;
        }
      }
    }
    
    this.saveCredentials();
    console.log(`YouTube sync completed: found ${allComments.length} total comments from ${youtubeAccounts.length} accounts`);
    
    return allComments;
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
    // Find the account that has access to this comment
    const account = this.platforms.facebook.accounts.find(acc => acc.connected);
    if (!account) {
      throw new Error('No connected Facebook account found');
    }
    
    const { accessToken } = account;
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
    // Find the account that has access to this comment
    const account = this.platforms.instagram.accounts.find(acc => acc.connected);
    if (!account) {
      throw new Error('No connected Instagram account found');
    }
    
    const { accessToken } = account;
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
    // Find the account that has access to this comment
    const account = this.platforms.youtube.accounts.find(acc => acc.connected);
    if (!account) {
      throw new Error('No connected YouTube account found');
    }
    
    const { accessToken, apiKey } = account;
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
      return { connected: false, accounts: [], connectedAccounts: [], accountCount: 0 };
    }
    
    // Ensure accounts array exists
    if (!this.platforms[platform].accounts) {
      this.platforms[platform].accounts = [];
    }
    
    const connectedAccounts = this.platforms[platform].accounts.filter(acc => acc && acc.connected);
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