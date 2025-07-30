# Supernova Comment Monitor

A comprehensive social media comment monitoring and management dashboard that allows you to track, analyze, and respond to comments across Facebook, Instagram, and YouTube from a single interface.

## Features

### 🔗 Multi-Platform Integration
- **Facebook**: Connect via Graph API to monitor page comments
- **Instagram**: Monitor comments through Instagram Basic Display API
- **YouTube**: Track video comments using YouTube Data API v3

### 📊 Real-Time Dashboard
- Live metrics: Total comments, response rate, urgent issues, sentiment analysis
- Recent comments feed with platform indicators
- Smart notifications for high-priority items
- Auto-refresh functionality (customizable intervals)

### 💬 Comment Management
- **Filtering**: By platform, category, priority, and response status
- **Search**: Find specific comments or authors
- **Sentiment Analysis**: Automatic positive/negative/neutral classification
- **Priority Levels**: High, medium, low based on content analysis
- **Response Templates**: Pre-built responses for common scenarios

### 📈 Analytics & Reporting
- **Trends Chart**: Comment volume over time
- **Sentiment Distribution**: Visual breakdown of comment sentiment
- **Platform Performance**: Compare activity across platforms
- **Response Metrics**: Track response times and rates

### ⚙️ Settings & Configuration
- **Auto-refresh**: Configure automatic comment fetching intervals
- **Data Export**: Export all data as JSON for backup/analysis
- **Data Management**: Clear all data when needed
- **Local Storage**: All data persisted locally in browser

## Setup Instructions

### 1. Platform API Setup

#### Facebook Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the "Facebook Login" product
4. Generate an access token with these permissions:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_show_list`
5. Get your Facebook Page ID from your page settings

#### Instagram Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Add "Instagram Basic Display" to your app
3. Complete the Instagram Basic Display setup
4. Generate an access token with these permissions:
   - `user_profile`
   - `user_media`
5. Get your Instagram User ID

#### YouTube Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials:
   - API Key for public data access
   - OAuth 2.0 Client ID for authenticated requests
5. Get your YouTube Channel ID from your channel page

### 2. Application Setup

1. **Download/Clone** the project files
2. **Deploy** to any web server (Vercel, Netlify, GitHub Pages, etc.)
3. **Open** the dashboard in your web browser
4. **Connect Platforms**:
   - Click on "Accounts" in the sidebar
   - Click "Connect" for each platform
   - Enter your API credentials when prompted

### 3. Usage

#### Connecting Platforms
1. Navigate to the "Accounts" section
2. Click "Connect" next to the platform you want to add
3. Enter the required credentials:
   - **Facebook**: Access Token + Page ID
   - **Instagram**: Access Token + User ID  
   - **YouTube**: Access Token + Channel ID + API Key
4. Click "Connect" to authenticate

#### Monitoring Comments
- **Dashboard**: View overview metrics and recent activity
- **Comments**: See all comments with filtering and search options
- **Analytics**: View trends and performance data

#### Responding to Comments
1. Click "Reply" next to any comment
2. Use response templates or write custom replies
3. Send responses directly to the platform
4. Mark comments as "handled" when resolved

#### Managing Settings
1. Click the settings icon (⚙️) in the top right
2. Configure auto-refresh intervals
3. Enable/disable notification sounds
4. Export data or clear all stored information

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: Browser localStorage for data persistence
- **APIs**: Direct integration with social media platform APIs
- **Charts**: Chart.js for analytics visualization

### Data Storage
All data is stored locally in your browser:
- `supernova_credentials`: API tokens and connection info
- `supernova_comments`: Comment data and responses
- `supernova_settings`: User preferences and configuration

### Security
- API credentials are stored locally in your browser only
- No data is sent to external servers (except direct API calls)
- Use HTTPS in production for secure API communications

## API Rate Limits

Be aware of platform rate limits:
- **Facebook**: 200 calls per user per hour
- **Instagram**: 240 calls per user per hour  
- **YouTube**: 10,000 quota units per day

## Troubleshooting

### Connection Issues
- **Invalid Token**: Regenerate tokens and ensure proper permissions
- **CORS Errors**: Some APIs may require server-side proxy in production
- **Rate Limits**: Reduce auto-refresh frequency if hitting limits

### Common Solutions
1. **Clear browser cache** if experiencing issues
2. **Check console** for detailed error messages
3. **Regenerate API tokens** if authentication fails
4. **Verify permissions** on your API applications

## Advanced Features

### Sentiment Analysis
Comments are automatically analyzed for sentiment using keyword matching:
- **Positive**: Contains words like "love", "great", "awesome"
- **Negative**: Contains words like "hate", "terrible", "awful"
- **Neutral**: Balanced or no strong sentiment indicators

### Smart Categorization
Comments are automatically categorized:
- **Questions**: Contains question words or question marks
- **Refunds**: Mentions refunds, returns, or money back
- **Feedback**: General positive or negative feedback
- **General**: Everything else

### Priority Detection
Priority levels are assigned based on content:
- **High**: Contains urgent words like "immediately", "terrible", "angry"
- **Medium**: Contains help-seeking words like "question", "help", "issue"
- **Low**: General comments without urgency indicators

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your API credentials and permissions
3. Ensure you haven't exceeded rate limits
4. Try refreshing the page or clearing browser data

## License

This project is open source and available under the MIT License.