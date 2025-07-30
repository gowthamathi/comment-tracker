// Application Data
const appData = {
  "comments": [
    {
      "id": "c001",
      "platform": "facebook",
      "text": "I ordered a product last week but haven't received any shipping confirmation. Can someone help me track my order?",
      "author": "Sarah Johnson",
      "sentiment": -0.2,
      "category": "questions",
      "priority": "medium",
      "timestamp": "2025-07-30T14:30:00Z",
      "responded": false
    },
    {
      "id": "c002", 
      "platform": "instagram",
      "text": "Absolutely love this product! Best purchase I've made all year. Will definitely be ordering again soon!",
      "author": "Mike Chen",
      "sentiment": 0.8,
      "category": "feedback",
      "priority": "low",
      "timestamp": "2025-07-30T13:45:00Z",
      "responded": true
    },
    {
      "id": "c003",
      "platform": "youtube",
      "text": "This is terrible quality. I want my money back immediately. Your customer service is useless.",
      "author": "Alex Rodriguez",
      "sentiment": -0.9,
      "category": "refunds", 
      "priority": "high",
      "timestamp": "2025-07-30T15:15:00Z",
      "responded": false
    },
    {
      "id": "c004",
      "platform": "facebook",
      "text": "When will the new collection be available? I've been waiting for months!",
      "author": "Emma Wilson",
      "sentiment": 0.1,
      "category": "questions",
      "priority": "medium",
      "timestamp": "2025-07-30T12:20:00Z",
      "responded": true
    },
    {
      "id": "c005",
      "platform": "instagram", 
      "text": "The packaging was damaged when it arrived. How do I get a replacement?",
      "author": "David Kim",
      "sentiment": -0.3,
      "category": "questions",
      "priority": "medium",
      "timestamp": "2025-07-30T16:00:00Z",
      "responded": false
    },
    {
      "id": "c006",
      "platform": "youtube",
      "text": "Great tutorial! This helped me solve my problem perfectly. Thank you!",
      "author": "Lisa Thompson",
      "sentiment": 0.7,
      "category": "feedback",
      "priority": "low", 
      "timestamp": "2025-07-30T11:30:00Z",
      "responded": true
    },
    {
      "id": "c007",
      "platform": "facebook",
      "text": "I need to cancel my order placed yesterday. The refund process is taking too long!",
      "author": "Robert Taylor",
      "sentiment": -0.6,
      "category": "refunds",
      "priority": "high",
      "timestamp": "2025-07-30T17:45:00Z",
      "responded": false
    },
    {
      "id": "c008",
      "platform": "instagram",
      "text": "Amazing customer service! They resolved my issue within hours. Highly recommend!",
      "author": "Jennifer Davis",
      "sentiment": 0.9,
      "category": "feedback",
      "priority": "low",
      "timestamp": "2025-07-30T10:15:00Z",
      "responded": true
    }
  ],
  "notifications": [
    {
      "id": "n001",
      "type": "urgent",
      "title": "High Priority Refund Request",
      "message": "Alex Rodriguez requesting immediate refund - negative sentiment detected",
      "timestamp": "2025-07-30T15:15:00Z",
      "read": false
    },
    {
      "id": "n002", 
      "type": "medium",
      "title": "Multiple Shipping Inquiries",
      "message": "3 customers asking about shipping updates in the last hour",
      "timestamp": "2025-07-30T14:45:00Z",
      "read": false
    },
    {
      "id": "n003",
      "type": "info",
      "title": "Positive Feedback Increase", 
      "message": "Positive sentiment up 12% compared to yesterday",
      "timestamp": "2025-07-30T13:30:00Z",
      "read": true
    }
  ],
  "chartData": {
    "commentTrends": [
      {"date": "2025-07-24", "comments": 180},
      {"date": "2025-07-25", "comments": 165},
      {"date": "2025-07-26", "comments": 195},
      {"date": "2025-07-27", "comments": 220},
      {"date": "2025-07-28", "comments": 210},
      {"date": "2025-07-29", "comments": 235},
      {"date": "2025-07-30", "comments": 247}
    ],
    "sentimentDistribution": [
      {"label": "Positive", "value": 45, "color": "#4CAF50"},
      {"label": "Neutral", "value": 35, "color": "#FFC107"}, 
      {"label": "Negative", "value": 20, "color": "#F44336"}
    ],
    "platformBreakdown": [
      {"platform": "Instagram", "comments": 124},
      {"platform": "Facebook", "comments": 89},
      {"platform": "YouTube", "comments": 34}
    ]
  }
};

// Application State
let currentView = 'dashboard';
let currentFilter = 'all';
let currentPlatformFilter = 'all';
let filteredComments = [...appData.comments];
let charts = {};

// Utility Functions
function formatTimeAgo(timestamp) {
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

function getSentimentClass(sentiment) {
  if (sentiment > 0.2) return 'positive';
  if (sentiment < -0.2) return 'negative';
  return 'neutral';
}

function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getPlatformIcon(platform) {
  const icons = {
    facebook: 'fab fa-facebook',
    instagram: 'fab fa-instagram',
    youtube: 'fab fa-youtube'
  };
  return icons[platform] || 'fas fa-globe';
}

// View Management
function switchView(viewName) {
  console.log('Switching to view:', viewName); // Debug log
  
  // Hide all views
  const allViews = document.querySelectorAll('.view');
  allViews.forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none'; // Force hide
  });
  
  // Show selected view
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) {
    targetView.classList.add('active');
    targetView.style.display = 'block'; // Force show
  } else {
    console.error('View not found:', `${viewName}-view`);
    return;
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
  
  currentView = viewName;
  
  // Initialize view-specific content
  if (viewName === 'analytics') {
    // Delay chart initialization to ensure DOM is ready
    setTimeout(() => {
      initializeCharts();
    }, 100);
  } else if (viewName === 'comments') {
    // Refresh comments table
    applyFilters();
  }
}

// Dashboard Functions
function populateRecentComments() {
  const container = document.getElementById('recentCommentsFeed');
  if (!container) return;
  
  const recentComments = appData.comments
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
  
  container.innerHTML = recentComments.map(comment => `
    <div class="comment-item">
      <div class="comment-platform">
        <div class="platform-icon ${comment.platform}">
          <i class="${getPlatformIcon(comment.platform)}"></i>
        </div>
      </div>
      <div class="comment-content">
        <div class="comment-author">${comment.author}</div>
        <div class="comment-text">${truncateText(comment.text, 120)}</div>
        <div class="comment-meta">
          <div class="sentiment-indicator ${getSentimentClass(comment.sentiment)}"></div>
          <span class="category-tag">${comment.category}</span>
          <span class="priority-indicator ${comment.priority}">${comment.priority}</span>
          <span class="comment-time">${formatTimeAgo(comment.timestamp)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function populateNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  
  const recentNotifications = appData.notifications.slice(0, 3);
  
  container.innerHTML = recentNotifications.map(notification => `
    <div class="notification-item ${notification.type}">
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
    </div>
  `).join('');
}

// Comments Functions
function applyFilters() {
  let filtered = [...appData.comments];
  
  // Apply category filter
  if (currentFilter !== 'all') {
    if (currentFilter === 'urgent') {
      filtered = filtered.filter(comment => comment.priority === 'high');
    } else if (currentFilter === 'unresponded') {
      filtered = filtered.filter(comment => !comment.responded);
    } else {
      filtered = filtered.filter(comment => comment.category === currentFilter);
    }
  }
  
  // Apply platform filter
  if (currentPlatformFilter !== 'all') {
    filtered = filtered.filter(comment => comment.platform === currentPlatformFilter);
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
  
  filteredComments = filtered;
  populateCommentsTable();
}

function populateCommentsTable() {
  const container = document.getElementById('commentsTableBody');
  if (!container) return;
  
  container.innerHTML = filteredComments.map(comment => `
    <div class="table-row">
      <div class="table-cell">
        <div class="platform-icon ${comment.platform}">
          <i class="${getPlatformIcon(comment.platform)}"></i>
        </div>
      </div>
      <div class="table-cell">
        <div class="comment-preview" onclick="expandComment('${comment.id}')">
          ${truncateText(comment.text, 80)}
        </div>
        <div class="comment-author" style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">
          by ${comment.author}
        </div>
      </div>
      <div class="table-cell">
        <div class="sentiment-indicator ${getSentimentClass(comment.sentiment)}"></div>
      </div>
      <div class="table-cell">
        <span class="category-tag">${comment.category}</span>
      </div>
      <div class="table-cell">
        <span class="priority-indicator ${comment.priority}">${comment.priority}</span>
      </div>
      <div class="table-cell">
        ${formatTimeAgo(comment.timestamp)}
      </div>
      <div class="table-cell">
        <span class="status-badge ${comment.responded ? 'responded' : 'pending'}">
          ${comment.responded ? 'Responded' : 'Pending'}
        </span>
      </div>
      <div class="table-cell">
        <div class="table-actions">
          <button class="action-btn" onclick="openResponseModal('${comment.id}')">Reply</button>
          ${!comment.responded ? `<button class="action-btn secondary" onclick="markAsHandled('${comment.id}')">Mark Done</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function expandComment(commentId) {
  const comment = appData.comments.find(c => c.id === commentId);
  if (comment) {
    alert(`Full comment from ${comment.author}:\n\n"${comment.text}"`);
  }
}

function markAsHandled(commentId) {
  const comment = appData.comments.find(c => c.id === commentId);
  if (comment) {
    comment.responded = true;
    applyFilters();
    
    // Show success message
    showToast('Comment marked as handled successfully!', 'success');
  }
}

function showToast(message, type = 'info') {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: var(--color-success);
    color: white;
    border-radius: 6px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Modal Functions
function openResponseModal(commentId) {
  const comment = appData.comments.find(c => c.id === commentId);
  if (!comment) return;
  
  const modal = document.getElementById('responseModal');
  const originalComment = document.getElementById('originalComment');
  
  if (!modal || !originalComment) return;
  
  originalComment.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <div class="platform-icon ${comment.platform}">
        <i class="${getPlatformIcon(comment.platform)}"></i>
      </div>
      <div>
        <div style="font-weight: 500; margin-bottom: 4px;">${comment.author}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">${formatTimeAgo(comment.timestamp)}</div>
      </div>
    </div>
    <div style="color: var(--color-text-secondary);">"${comment.text}"</div>
  `;
  
  modal.classList.remove('hidden');
  modal.dataset.commentId = commentId;
}

function closeResponseModal() {
  const modal = document.getElementById('responseModal');
  const responseText = document.getElementById('responseText');
  
  if (modal) modal.classList.add('hidden');
  if (responseText) responseText.value = '';
}

function sendResponse() {
  const modal = document.getElementById('responseModal');
  const responseText = document.getElementById('responseText');
  
  if (!modal || !responseText) return;
  
  const commentId = modal.dataset.commentId;
  const responseTextValue = responseText.value.trim();
  
  if (!responseTextValue) {
    alert('Please enter a response before sending.');
    return;
  }
  
  const comment = appData.comments.find(c => c.id === commentId);
  if (comment) {
    comment.responded = true;
    applyFilters();
    closeResponseModal();
    showToast('Response sent successfully!', 'success');
  }
}

// Template Functions
function insertTemplate(template) {
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

// Analytics Functions
function initializeCharts() {
  if (Object.keys(charts).length > 0) return; // Charts already initialized
  
  try {
    // Trends Chart
    const trendsCanvas = document.getElementById('trendsChart');
    if (trendsCanvas) {
      const trendsCtx = trendsCanvas.getContext('2d');
      charts.trends = new Chart(trendsCtx, {
        type: 'line',
        data: {
          labels: appData.chartData.commentTrends.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
          datasets: [{
            label: 'Comments',
            data: appData.chartData.commentTrends.map(item => item.comments),
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
    
    // Sentiment Chart
    const sentimentCanvas = document.getElementById('sentimentChart');
    if (sentimentCanvas) {
      const sentimentCtx = sentimentCanvas.getContext('2d');
      charts.sentiment = new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
          labels: appData.chartData.sentimentDistribution.map(item => item.label),
          datasets: [{
            data: appData.chartData.sentimentDistribution.map(item => item.value),
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
    
    // Platform Chart
    const platformCanvas = document.getElementById('platformChart');
    if (platformCanvas) {   
      const platformCtx = platformCanvas.getContext('2d');
      charts.platform = new Chart(platformCtx, {
        type: 'bar',
        data: {
          labels: appData.chartData.platformBreakdown.map(item => item.platform),
          datasets: [{
            label: 'Comments',
            data: appData.chartData.platformBreakdown.map(item => item.comments),
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
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

// Notification Functions
function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;
  
  panel.classList.toggle('hidden');
  
  if (!panel.classList.contains('hidden')) {
    populateNotificationPanel();
  }
}

function populateNotificationPanel() {
  const container = document.getElementById('notificationContent');
  if (!container) return;
  
  container.innerHTML = appData.notifications.map(notification => `
    <div class="notification-item ${notification.type}">
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
    </div>
  `).join('');
}

function updateNotificationBadge() {
  const unreadCount = appData.notifications.filter(n => !n.read).length;
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded'); // Debug log
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      console.log('Nav item clicked:', view); // Debug log
      switchView(view);
    });
  });
  
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilters();
    });
  });
  
  // Platform filters
  document.querySelectorAll('.platform-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlatformFilter = btn.dataset.platform;
      applyFilters();
    });
  });
  
  // Search
  const searchInput = document.getElementById('commentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  // Modal controls
  const closeModal = document.getElementById('closeModal');
  const cancelResponse = document.getElementById('cancelResponse');
  const sendResponseBtn = document.getElementById('sendResponse');
  
  if (closeModal) closeModal.addEventListener('click', closeResponseModal);
  if (cancelResponse) cancelResponse.addEventListener('click', closeResponseModal);
  if (sendResponseBtn) sendResponseBtn.addEventListener('click', sendResponse);
  
  // Template buttons
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      insertTemplate(btn.dataset.template);
    });
  });
  
  // Notification controls
  const notificationBell = document.getElementById('notificationBell');
  const closeNotifications = document.getElementById('closeNotifications');
  
  if (notificationBell) {
    notificationBell.addEventListener('click', toggleNotificationPanel);
  }
  
  if (closeNotifications) {
    closeNotifications.addEventListener('click', () => {
      const panel = document.getElementById('notificationPanel');
      if (panel) panel.classList.add('hidden');
    });
  }
  
  // Close modal when clicking outside
  const responseModal = document.getElementById('responseModal');
  if (responseModal) {
    responseModal.addEventListener('click', (e) => {
      if (e.target.id === 'responseModal') {
        closeResponseModal();
      }
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
  
  // Initialize
  populateRecentComments();
  populateNotifications();
  applyFilters();
  updateNotificationBadge();
  
  // Simulate real-time updates
  setInterval(() => {
    // Simulate new comments or updates
    const randomIndex = Math.floor(Math.random() * appData.comments.length);
    const comment = appData.comments[randomIndex];
    
    // Randomly update timestamps to simulate activity
    if (Math.random() > 0.8) {
      comment.timestamp = new Date().toISOString();
      
      if (currentView === 'dashboard') {
        populateRecentComments();
      } else if (currentView === 'comments') {
        applyFilters();
      }
    }
  }, 10000); // Update every 10 seconds
  
  console.log('Initialization complete'); // Debug log
});

// Export for debugging
window.appData = appData;
window.switchView = switchView;