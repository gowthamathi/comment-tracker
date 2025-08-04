// Enhanced Supernova Comment Monitor Application
class SupernovaApp {
  constructor() {
    this.api = new SocialMediaAPI();
    this.comments = [];
    this.filteredComments = [];
    this.currentView = 'dashboard';
    this.currentFilter = 'all';
    this.currentPlatformFilter = 'all';
    this.charts = {};
    this.autoRefreshInterval = null;
    this.settings = {
      autoRefresh: 60000, // 1 minute default
      notificationSound: 'enabled'
    };
    
    this.loadSettings();
    this.loadStoredComments();
    this.init();
  }

  // Initialize the application
  init() {
    console.log('Initializing Supernova Comment Monitor...');
    try {
      this.setupEventListeners();
      this.updatePlatformStatus();
      this.refreshDashboard();
      this.setupAutoRefresh();
      this.addGlobalErrorHandlers();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showToast('Failed to initialize application: ' + error.message, 'error');
    }
  }

  // Load settings from localStorage
  loadSettings() {
    const stored = localStorage.getItem('supernova_settings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }

  // Save settings to localStorage
  saveSettings() {
    localStorage.setItem('supernova_settings', JSON.stringify(this.settings));
  }

  // Load stored comments from localStorage
  loadStoredComments() {
    const stored = localStorage.getItem('supernova_comments');
    if (stored) {
      try {
        this.comments = JSON.parse(stored);
        this.filteredComments = [...this.comments];
      } catch (error) {
        console.error('Error loading stored comments:', error);
      }
    }
  }

  // Save comments to localStorage
  saveComments() {
    localStorage.setItem('supernova_comments', JSON.stringify(this.comments));
  }

  // Setup all event listeners
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Platform connection buttons
    document.querySelectorAll('.platform-connect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = btn.dataset.platform;
        const isConnected = this.api.getPlatformStatus(platform).connected;
        
        if (isConnected) {
          this.disconnectPlatform(platform);
        } else {
          this.showConnectionModal(platform);
        }
      });
    });

    // Connection modal handlers
    this.setupConnectionModals();
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettingsModal());
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.applyFilters();
      });
    });

    // Platform filters
    document.querySelectorAll('.platform-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.platform-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPlatformFilter = btn.dataset.platform;
        this.applyFilters();
      });
    });

    // Search
    const searchInput = document.getElementById('commentSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFilters());
    }

    // Response modal handlers
    this.setupResponseModal();

    // Notification handlers
    this.setupNotificationHandlers();
  }

  // Setup connection modals
  setupConnectionModals() {
    const platforms = ['facebook', 'instagram', 'youtube'];
    
    platforms.forEach(platform => {
      const modal = document.getElementById(`${platform}Modal`);
      const closeBtn = document.getElementById(`close${platform.charAt(0).toUpperCase() + platform.slice(1)}Modal`);
      const cancelBtn = document.getElementById(`cancel${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
      const connectBtn = document.getElementById(`connect${platform.charAt(0).toUpperCase() + platform.slice(1)}`);

      if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal(`${platform}Modal`));
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal(`${platform}Modal`));
      if (connectBtn) connectBtn.addEventListener('click', () => this.connectPlatform(platform));

      // Close on outside click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target.id === `${platform}Modal`) {
            this.hideModal(`${platform}Modal`);
          }
        });
      }
    });
  }

  // Setup response modal
  setupResponseModal() {
    const modal = document.getElementById('responseModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelResponse');
    const sendBtn = document.getElementById('sendResponse');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeResponseModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeResponseModal());
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendResponse());

    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.insertTemplate(btn.dataset.template);
      });
    });

    // Close on outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'responseModal') {
          this.closeResponseModal();
        }
      });
    }
  }

  // Setup notification handlers
  setupNotificationHandlers() {
    const notificationBell = document.getElementById('notificationBell');
    const closeNotifications = document.getElementById('closeNotifications');

    if (notificationBell) {
      notificationBell.addEventListener('click', () => this.toggleNotificationPanel());
    }

    if (closeNotifications) {
      closeNotifications.addEventListener('click', () => {
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.classList.add('hidden');
      });
    }

    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notificationPanel');
      const bell = document.getElementById('notificationBell');
      
      if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.classList.add('hidden');
      }
    });
  }

  // Setup settings modal
  setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsModal');
    const saveBtn = document.getElementById('saveSettings');
    const exportBtn = document.getElementById('exportData');
    const clearBtn = document.getElementById('clearAllData');

    if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal('settingsModal'));
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveAppSettings());
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllData());

    // Close on outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
          this.hideModal('settingsModal');
        }
      });
    }
  }

  // Show connection modal for platform
  showConnectionModal(platform) {
    const modal = document.getElementById(`${platform}Modal`);
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  // Show settings modal
  showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      // Populate current settings
      const autoRefreshSelect = document.getElementById('autoRefreshInterval');
      const notificationSelect = document.getElementById('notificationSound');
      
      if (autoRefreshSelect) autoRefreshSelect.value = this.settings.autoRefresh;
      if (notificationSelect) notificationSelect.value = this.settings.notificationSound;
      
      modal.classList.remove('hidden');
      this.setupSettingsModal(); // Setup event listeners
    }
  }

  // Hide modal
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Connect platform
  async connectPlatform(platform) {
    const connectBtn = document.getElementById(`connect${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
    const originalBtnText = connectBtn?.textContent;
    
    try {
      // Show loading state
      if (connectBtn) {
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;
      }
      
      let result;
      
      switch (platform) {
        case 'facebook':
          const fbToken = document.getElementById('facebookToken').value.trim();
          const fbPageId = document.getElementById('facebookPageId').value.trim();
          const fbAccountName = document.getElementById('facebookAccountName').value.trim();
          
          if (!fbToken) {
            this.showToast('Please enter your Facebook access token', 'error');
            return;
          }
          if (!fbPageId) {
            this.showToast('Please enter your Facebook Page ID', 'error');
            return;
          }
          
          // Validate Page ID format
          if (!/^\d+$/.test(fbPageId)) {
            this.showToast('Facebook Page ID should only contain numbers', 'error');
            return;
          }
          
          console.log('Attempting Facebook connection...');
          result = await this.api.connectFacebook(fbToken, fbPageId, fbAccountName);
          break;
          
        case 'instagram':
          const igToken = document.getElementById('instagramToken').value.trim();
          const igUserId = document.getElementById('instagramUserId').value.trim();
          const igAccountName = document.getElementById('instagramAccountName').value.trim();
          
          if (!igToken) {
            this.showToast('Please enter your Instagram access token', 'error');
            return;
          }
          if (!igUserId) {
            this.showToast('Please enter your Instagram User ID', 'error');
            return;
          }
          
          console.log('Attempting Instagram connection...');
          result = await this.api.connectInstagram(igToken, igUserId, igAccountName);
          break;
          
        case 'youtube':
          const ytToken = document.getElementById('youtubeToken').value.trim();
          const ytChannelId = document.getElementById('youtubeChannelId').value.trim();
          const ytApiKey = document.getElementById('youtubeApiKey').value.trim();
          const ytAccountName = document.getElementById('youtubeAccountName').value.trim();
          
          if (!ytToken) {
            this.showToast('Please enter your YouTube access token', 'error');
            return;
          }
          if (!ytChannelId) {
            this.showToast('Please enter your YouTube Channel ID', 'error');
            return;
          }
          if (!ytApiKey) {
            this.showToast('Please enter your YouTube API key', 'error');
            return;
          }
          
          console.log('Attempting YouTube connection...');
          result = await this.api.connectYouTube(ytToken, ytChannelId, ytApiKey, ytAccountName);
          break;
      }

      if (result.success) {
        this.showToast(result.message, 'success');
        this.hideModal(`${platform}Modal`);
        this.updatePlatformStatus();
        // Clear form fields on successful connection
        this.clearConnectionForm(platform);
        // Trigger initial sync
        setTimeout(() => this.refreshComments(), 1000);
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Connection error:', error);
      this.showToast('Connection failed: ' + (error.message || 'Unknown error occurred'), 'error');
    } finally {
      // Restore button state
      if (connectBtn) {
        connectBtn.textContent = originalBtnText;
        connectBtn.disabled = false;
      }
    }
  }

  // Disconnect platform
  disconnectPlatform(platform) {
    if (confirm(`Are you sure you want to disconnect ${platform.charAt(0).toUpperCase() + platform.slice(1)}? This will stop syncing comments from this platform.`)) {
      console.log(`Disconnecting ${platform}...`);
      const result = this.api.disconnectPlatform(platform);
      if (result.success) {
        this.showToast(result.message, 'success');
        this.updatePlatformStatus();
        // Remove comments from disconnected platform
        this.comments = this.comments.filter(comment => comment.platform !== platform);
        this.saveComments();
        this.applyFilters();
        this.refreshDashboard();
      } else {
        this.showToast(result.message, 'error');
      }
    }
  }

  // Update platform connection status in UI
  updatePlatformStatus() {
    const platforms = ['facebook', 'instagram', 'youtube'];
    
    platforms.forEach(platform => {
      const status = this.api.getPlatformStatus(platform);
      const statusBadge = document.getElementById(`${platform}-status`);
      const statsDiv = document.getElementById(`${platform}-stats`);
      const btn = document.getElementById(`${platform}-btn`);
      
      if (statusBadge && btn) {
        if (status.connected && status.accountCount > 0) {
          if (status.accountCount === 1) {
            statusBadge.textContent = `Connected (${status.connectedAccounts[0].name})`;
          } else {
            statusBadge.textContent = `Connected (${status.accountCount} accounts)`;
          }
          statusBadge.className = 'status-badge connected';
          btn.textContent = status.accountCount === 1 ? 'Disconnect' : 'Manage';
          btn.className = 'btn btn--outline';
          if (statsDiv) statsDiv.style.display = 'block';
        } else {
          statusBadge.textContent = 'Not Connected';
          statusBadge.className = 'status-badge pending';
          btn.textContent = 'Connect';
          btn.className = 'btn btn--secondary';
          if (statsDiv) statsDiv.style.display = 'none';
        }
      }
    });
  }

  // Switch view
  switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }
    
    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      comments: 'Comment Monitoring',
      analytics: 'Analytics & Reports',
      accounts: 'Account Management'
    };
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      titleElement.textContent = titles[viewName] || viewName;
    }
    
    this.currentView = viewName;
    
    // Initialize view-specific content
    if (viewName === 'analytics') {
      setTimeout(() => this.initializeCharts(), 100);
    } else if (viewName === 'comments') {
      this.applyFilters();
    } else if (viewName === 'dashboard') {
      this.refreshDashboard();
    }
  }

  // Refresh comments from all connected platforms
  async refreshComments() {
    console.log('Starting comment refresh...');
    const connectedPlatforms = this.api.getConnectedPlatforms();
    
    if (connectedPlatforms.length === 0) {
      this.showToast('No platforms connected. Please connect your social media accounts first.', 'warning');
      return;
    }
    
    let totalNewComments = 0;
    let syncErrors = [];
    
    try {
      const newComments = await this.api.fetchAllComments();
      
      // Merge with existing comments, avoiding duplicates
      newComments.forEach(newComment => {
        const exists = this.comments.find(existing => existing.id === newComment.id);
        if (!exists) {
          this.comments.unshift(newComment);
          totalNewComments++;
        }
      });
      
      // Sort by timestamp (newest first)
      this.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Keep only last 1000 comments to avoid memory issues
      if (this.comments.length > 1000) {
        this.comments = this.comments.slice(0, 1000);
      }
      
      this.saveComments();
      this.applyFilters();
      this.refreshDashboard();
      this.updateNotificationBadge();
      
      if (totalNewComments > 0) {
        this.showToast(`Fetched ${totalNewComments} new comments`, 'success');
      } else {
        this.showToast('Sync completed - no new comments found', 'info');
      }
      
      console.log(`Comment refresh completed. New comments: ${totalNewComments}`);
    } catch (error) {
      console.error('Error refreshing comments:', error);
      this.showToast('Sync failed: ' + error.message, 'error');
      
      // Still refresh the dashboard to show updated sync times
      this.refreshDashboard();
    }
  }

  // Apply filters to comments
  applyFilters() {
    let filtered = [...this.comments];
    
    // Apply category filter
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'urgent') {
        filtered = filtered.filter(comment => comment.priority === 'high');
      } else if (this.currentFilter === 'unresponded') {
        filtered = filtered.filter(comment => !comment.responded);
      } else {
        filtered = filtered.filter(comment => comment.category === this.currentFilter);
      }
    }
    
    // Apply platform filter
    if (this.currentPlatformFilter !== 'all') {
      filtered = filtered.filter(comment => comment.platform === this.currentPlatformFilter);
    }
    
    // Apply search filter
    const searchInput = document.getElementById('commentSearch');
    if (searchInput) {
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm) {
        filtered = filtered.filter(comment => 
          comment.text.toLowerCase().includes(searchTerm) ||
          comment.author.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    this.filteredComments = filtered;
    this.populateCommentsTable();
  }

  // Populate comments table
  populateCommentsTable() {
    const container = document.getElementById('commentsTableBody');
    if (!container) return;
    
    if (this.filteredComments.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">No comments found</div>';
      return;
    }
    
    container.innerHTML = this.filteredComments.map(comment => `
      <div class="table-row">
        <div class="table-cell">
          <div class="platform-icon ${comment.platform}">
            <i class="${this.getPlatformIcon(comment.platform)}"></i>
          </div>
        </div>
        <div class="table-cell">
          <div class="comment-preview" onclick="app.expandComment('${comment.id}')">
            ${this.truncateText(comment.text, 80)}
          </div>
          <div class="comment-author" style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">
            by ${comment.author}
            ${comment.commentUrl ? `<a href="${comment.commentUrl}" target="_blank" class="comment-link" title="View original comment" style="margin-left: 8px; color: var(--color-primary);"><i class="fas fa-external-link-alt"></i></a>` : ''}
            ${comment.postUrl ? `<a href="${comment.postUrl}" target="_blank" class="post-link" title="View original post" style="margin-left: 4px; color: var(--color-secondary);"><i class="fas fa-link"></i></a>` : ''}
            ${comment.type ? `<span class="comment-type-badge" title="Comment type: ${comment.type}" style="margin-left: 8px; font-size: 9px; padding: 2px 4px; background: var(--color-secondary); color: white; border-radius: 3px;">${this.getCommentTypeBadge(comment.type)}</span>` : ''}
          </div>
        </div>
        <div class="table-cell">
          <div class="sentiment-indicator ${this.getSentimentClass(comment.sentiment)}"></div>
        </div>
        <div class="table-cell">
          <span class="category-tag">${comment.category}</span>
        </div>
        <div class="table-cell">
          <span class="priority-indicator ${comment.priority}">${comment.priority}</span>
        </div>
        <div class="table-cell">
          ${this.formatTimeAgo(comment.timestamp)}
        </div>
        <div class="table-cell">
          <span class="status-badge ${comment.responded ? 'responded' : 'pending'}">
            ${comment.responded ? 'Responded' : 'Pending'}
          </span>
        </div>
        <div class="table-cell">
          <div class="table-actions">
            <button class="action-btn" onclick="app.openResponseModal('${comment.id}')">Reply</button>
            ${!comment.responded ? `<button class="action-btn secondary" onclick="app.markAsHandled('${comment.id}')">Mark Done</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Refresh dashboard
  refreshDashboard() {
    this.populateRecentComments();
    this.updateMetrics();
    this.populateNotifications();
  }

  // Populate recent comments feed
  populateRecentComments() {
    const container = document.getElementById('recentCommentsFeed');
    if (!container) return;
    
    const recentComments = this.comments
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    if (recentComments.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">No comments yet. Connect your social media accounts to start monitoring.</div>';
      return;
    }
    
    container.innerHTML = recentComments.map(comment => `
      <div class="comment-item">
        <div class="comment-platform">
          <div class="platform-icon ${comment.platform}">
            <i class="${this.getPlatformIcon(comment.platform)}"></i>
          </div>
        </div>
        <div class="comment-content">
          <div class="comment-author">${comment.author}</div>
          <div class="comment-text">${this.truncateText(comment.text, 120)}</div>
          <div class="comment-meta">
            <div class="sentiment-indicator ${this.getSentimentClass(comment.sentiment)}"></div>
            <span class="category-tag">${comment.category}</span>
            <span class="priority-indicator ${comment.priority}">${comment.priority}</span>
            <span class="comment-time">${this.formatTimeAgo(comment.timestamp)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Update metrics
  updateMetrics() {
    const totalComments = this.comments.length;
    const respondedComments = this.comments.filter(c => c.responded).length;
    const responseRate = totalComments > 0 ? Math.round((respondedComments / totalComments) * 100) : 0;
    const urgentIssues = this.comments.filter(c => c.priority === 'high' && !c.responded).length;
    const avgSentiment = totalComments > 0 ? 
      (this.comments.reduce((sum, c) => sum + c.sentiment, 0) / totalComments).toFixed(1) : 0;

    // Update metric values
    const metrics = document.querySelectorAll('.metric-value');
    if (metrics[0]) metrics[0].textContent = totalComments;
    if (metrics[1]) metrics[1].textContent = `${responseRate}%`;
    if (metrics[2]) metrics[2].textContent = urgentIssues;
    if (metrics[3]) metrics[3].textContent = `+${avgSentiment}`;

    // Update platform stats
    const platforms = ['facebook', 'instagram', 'youtube'];
    platforms.forEach(platform => {
      const platformComments = this.comments.filter(c => c.platform === platform);
      const todayComments = platformComments.filter(c => {
        const commentDate = new Date(c.timestamp);
        const today = new Date();
        return commentDate.toDateString() === today.toDateString();
      });

      const countElement = document.getElementById(`${platform}-comments-today`);
      const syncElement = document.getElementById(`${platform}-last-sync`);
      
      if (countElement) countElement.textContent = todayComments.length;
      
      // Get last sync time from API platform data
      const platformStatus = this.api.getPlatformStatus(platform);
      if (syncElement) {
        if (platformStatus.lastSync) {
          syncElement.textContent = this.formatTimeAgo(platformStatus.lastSync);
        } else if (platformStatus.lastSyncAttempt) {
          syncElement.textContent = `Failed: ${this.formatTimeAgo(platformStatus.lastSyncAttempt)}`;
          syncElement.style.color = 'var(--color-error)';
        } else {
          syncElement.textContent = 'Never';
          syncElement.style.color = 'var(--color-text-secondary)';
        }
      }
    });
  }

  // Populate notifications
  populateNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    const notifications = this.generateNotifications();
    
    container.innerHTML = notifications.slice(0, 3).map(notification => `
      <div class="notification-item ${notification.type}">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${this.formatTimeAgo(notification.timestamp)}</div>
      </div>
    `).join('');
  }

  // Generate notifications based on current data
  generateNotifications() {
    const notifications = [];
    const now = new Date();
    
    // High priority unresponded comments
    const urgentComments = this.comments.filter(c => c.priority === 'high' && !c.responded);
    if (urgentComments.length > 0) {
      notifications.push({
        id: 'urgent_' + Date.now(),
        type: 'urgent',
        title: 'High Priority Comments',
        message: `${urgentComments.length} high priority comments need immediate attention`,
        timestamp: now.toISOString(),
        read: false
      });
    }
    
    // Recent activity
    const recentComments = this.comments.filter(c => {
      const commentTime = new Date(c.timestamp);
      return (now - commentTime) < 3600000; // Last hour
    });
    
    if (recentComments.length > 0) {
      notifications.push({
        id: 'activity_' + Date.now(),
        type: 'medium',
        title: 'Recent Activity',
        message: `${recentComments.length} new comments in the last hour`,
        timestamp: now.toISOString(),
        read: false
      });
    }
    
    // Positive feedback
    const positiveComments = this.comments.filter(c => c.sentiment > 0.5);
    if (positiveComments.length > 0) {
      notifications.push({
        id: 'positive_' + Date.now(),
        type: 'info',
        title: 'Positive Feedback',
        message: `${positiveComments.length} positive comments received`,
        timestamp: now.toISOString(),
        read: false
      });
    }
    
    return notifications;
  }

  // Update notification badge
  updateNotificationBadge() {
    const notifications = this.generateNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Toggle notification panel
  toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;
    
    panel.classList.toggle('hidden');
    
    if (!panel.classList.contains('hidden')) {
      this.populateNotificationPanel();
    }
  }

  // Populate notification panel
  populateNotificationPanel() {
    const container = document.getElementById('notificationContent');
    if (!container) return;
    
    const notifications = this.generateNotifications();
    
    container.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.type}">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${this.formatTimeAgo(notification.timestamp)}</div>
      </div>
    `).join('');
  }

  // Open response modal
  openResponseModal(commentId) {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return;
    
    const modal = document.getElementById('responseModal');
    const originalComment = document.getElementById('originalComment');
    
    if (!modal || !originalComment) return;
    
    originalComment.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div class="platform-icon ${comment.platform}">
          <i class="${this.getPlatformIcon(comment.platform)}"></i>
        </div>
        <div>
          <div style="font-weight: 500; margin-bottom: 4px;">${comment.author}</div>
          <div style="font-size: 12px; color: var(--color-text-secondary);">${this.formatTimeAgo(comment.timestamp)}</div>
        </div>
      </div>
      <div style="color: var(--color-text-secondary);">"${comment.text}"</div>
    `;
    
    modal.classList.remove('hidden');
    modal.dataset.commentId = commentId;
  }

  // Close response modal
  closeResponseModal() {
    const modal = document.getElementById('responseModal');
    const responseText = document.getElementById('responseText');
    
    if (modal) modal.classList.add('hidden');
    if (responseText) responseText.value = '';
  }

  // Send response
  async sendResponse() {
    const modal = document.getElementById('responseModal');
    const responseText = document.getElementById('responseText');
    
    if (!modal || !responseText) return;
    
    const commentId = modal.dataset.commentId;
    const responseTextValue = responseText.value.trim();
    
    if (!responseTextValue) {
      this.showToast('Please enter a response before sending.', 'error');
      return;
    }
    
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      // Try to send actual response via API
      if (comment.originalId) {
        await this.api.replyToComment(comment.originalId, comment.platform, responseTextValue);
      }
      
      // Mark as responded in local data
      comment.responded = true;
      this.saveComments();
      this.applyFilters();
      this.refreshDashboard();
      this.closeResponseModal();
      this.showToast('Response sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending response:', error);
      // Still mark as responded locally even if API call fails
      comment.responded = true;
      this.saveComments();
      this.applyFilters();
      this.refreshDashboard();
      this.closeResponseModal();
      this.showToast('Response recorded (API call failed)', 'warning');
    }
  }

  // Mark comment as handled
  markAsHandled(commentId) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.responded = true;
      this.saveComments();
      this.applyFilters();
      this.refreshDashboard();
      this.showToast('Comment marked as handled successfully!', 'success');
    }
  }

  // Insert template
  insertTemplate(template) {
    const responseText = document.getElementById('responseText');
    if (!responseText) return;
    
    const templates = {
      thanks: "Thank you for your feedback! We really appreciate you taking the time to share your thoughts with us.",
      sorry: "We sincerely apologize for the inconvenience you've experienced. We're working to resolve this issue as quickly as possible.",
      help: "We're here to help! Please let us know if you need any additional assistance or have any other questions."
    };
    
    responseText.value = templates[template] || '';
    responseText.focus();
  }

  // Expand comment
  expandComment(commentId) {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      alert(`Full comment from ${comment.author}:\n\n"${comment.text}"`);
    }
  }

  // Initialize charts
  initializeCharts() {
    if (Object.keys(this.charts).length > 0) return;
    
    try {
      this.initializeTrendsChart();
      this.initializeSentimentChart();
      this.initializePlatformChart();
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  // Initialize trends chart
  initializeTrendsChart() {
    const trendsCanvas = document.getElementById('trendsChart');
    if (!trendsCanvas) return;
    
    const trendsData = this.generateTrendsData();
    const trendsCtx = trendsCanvas.getContext('2d');
    
    this.charts.trends = new Chart(trendsCtx, {
      type: 'line',
      data: {
        labels: trendsData.labels,
        datasets: [{
          label: 'Comments',
          data: trendsData.data,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Initialize sentiment chart
  initializeSentimentChart() {
    const sentimentCanvas = document.getElementById('sentimentChart');
    if (!sentimentCanvas) return;
    
    const sentimentData = this.generateSentimentData();
    const sentimentCtx = sentimentCanvas.getContext('2d');
    
    this.charts.sentiment = new Chart(sentimentCtx, {
      type: 'doughnut',
      data: {
        labels: sentimentData.labels,
        datasets: [{
          data: sentimentData.data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // Initialize platform chart
  initializePlatformChart() {
    const platformCanvas = document.getElementById('platformChart');
    if (!platformCanvas) return;
    
    const platformData = this.generatePlatformData();
    const platformCtx = platformCanvas.getContext('2d');
    
    this.charts.platform = new Chart(platformCtx, {
      type: 'bar',
      data: {
        labels: platformData.labels,
        datasets: [{
          label: 'Comments',
          data: platformData.data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Generate trends data
  generateTrendsData() {
    const last7Days = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date);
      
      const dayComments = this.comments.filter(comment => {
        const commentDate = new Date(comment.timestamp);
        return commentDate.toDateString() === date.toDateString();
      });
      
      data.push(dayComments.length);
    }
    
    return {
      labels: last7Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      data: data
    };
  }

  // Generate sentiment data
  generateSentimentData() {
    const positive = this.comments.filter(c => c.sentiment > 0.2).length;
    const neutral = this.comments.filter(c => c.sentiment >= -0.2 && c.sentiment <= 0.2).length;
    const negative = this.comments.filter(c => c.sentiment < -0.2).length;
    
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      data: [positive, neutral, negative]
    };
  }

  // Generate platform data
  generatePlatformData() {
    const facebook = this.comments.filter(c => c.platform === 'facebook').length;
    const instagram = this.comments.filter(c => c.platform === 'instagram').length;
    const youtube = this.comments.filter(c => c.platform === 'youtube').length;
    
    return {
      labels: ['Facebook', 'Instagram', 'YouTube'],
      data: [facebook, instagram, youtube]
    };
  }

  // Setup auto refresh
  setupAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    if (this.settings.autoRefresh > 0) {
      this.autoRefreshInterval = setInterval(() => {
        this.refreshComments();
      }, this.settings.autoRefresh);
    }
  }

  // Save app settings
  saveAppSettings() {
    const autoRefreshSelect = document.getElementById('autoRefreshInterval');
    const notificationSelect = document.getElementById('notificationSound');
    
    if (autoRefreshSelect) {
      this.settings.autoRefresh = parseInt(autoRefreshSelect.value);
    }
    if (notificationSelect) {
      this.settings.notificationSound = notificationSelect.value;
    }
    
    this.saveSettings();
    this.setupAutoRefresh();
    this.hideModal('settingsModal');
    this.showToast('Settings saved successfully!', 'success');
  }

  // Export data
  exportData() {
    const data = {
      comments: this.comments,
      settings: this.settings,
      platforms: this.api.platforms,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supernova_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Data exported successfully!', 'success');
  }

  // Clear all data
  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('supernova_comments');
      localStorage.removeItem('supernova_settings');
      localStorage.removeItem('supernova_credentials');
      
      this.comments = [];
      this.filteredComments = [];
      this.settings = { autoRefresh: 60000, notificationSound: 'enabled' };
      
      this.api = new SocialMediaAPI();
      this.updatePlatformStatus();
      this.applyFilters();
      this.refreshDashboard();
      
      this.showToast('All data cleared successfully!', 'success');
      this.hideModal('settingsModal');
    }
  }

  // Utility functions
  formatTimeAgo(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  }

  getSentimentClass(sentiment) {
    if (sentiment > 0.2) return 'positive';
    if (sentiment < -0.2) return 'negative';
    return 'neutral';
  }

  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getPlatformIcon(platform) {
    const icons = {
      facebook: 'fab fa-facebook',
      instagram: 'fab fa-instagram',
      youtube: 'fab fa-youtube'
    };
    return icons[platform] || 'fas fa-globe';
  }

  getCommentTypeBadge(type) {
    const types = {
      post_comment: 'POST',
      visitor_comment: 'PAGE',
      ad_comment: 'AD',
      media_comment: 'MEDIA',
      video_comment: 'VIDEO'
    };
    return types[type] || 'OTHER';
  }

  showToast(message, type = 'info') {
    // Remove any existing toasts to prevent stacking
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
      <i class="${icons[type] || icons.info}" style="margin-right: 8px;"></i>
      <span>${message}</span>
    `;
    
    const colors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      min-width: 300px;
      max-width: 500px;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after longer time for errors
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    });
  }

  // Clear connection form fields
  clearConnectionForm(platform) {
    switch (platform) {
      case 'facebook':
        document.getElementById('facebookAccountName').value = '';
        document.getElementById('facebookToken').value = '';
        document.getElementById('facebookPageId').value = '';
        break;
      case 'instagram':
        document.getElementById('instagramAccountName').value = '';
        document.getElementById('instagramToken').value = '';
        document.getElementById('instagramUserId').value = '';
        break;
      case 'youtube':
        document.getElementById('youtubeAccountName').value = '';
        document.getElementById('youtubeToken').value = '';
        document.getElementById('youtubeChannelId').value = '';
        document.getElementById('youtubeApiKey').value = '';
        break;
    }
  }

  // Add global error handlers
  addGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showToast('An unexpected error occurred: ' + (event.reason?.message || 'Unknown error'), 'error');
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      if (event.error?.message) {
        this.showToast('Application error: ' + event.error.message, 'error');
      }
    });

    // Handle network connection issues
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.showToast('Internet connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.showToast('Internet connection lost. Some features may not work.', 'warning');
    });
  }
}

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .toast {
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .toast:hover {
    transform: translateX(-5px);
  }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  try {
    window.app = new SupernovaApp();
  } catch (error) {
    console.error('Failed to initialize Supernova app:', error);
    // Show error even if app fails to initialize
    const errorToast = document.createElement('div');
    errorToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: #EF4444;
      color: white;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    errorToast.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>Failed to start application: ${error.message}`;
    document.body.appendChild(errorToast);
  }
});