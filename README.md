# AI News Crawler

A headless web crawler for LLM leaderboards that extracts rankings and saves them as JSON files locally. Built with Crawlee for robust scraping and designed to work in GitHub Actions.

## Features

- 🚀 **Headless crawling** - No GUI dependencies, perfect for CI/CD
- 📊 **Multiple leaderboards** - Extensible architecture for various LLM ranking sites
- 💾 **Local JSON storage** - Saves timestamped and latest versions
- 🔄 **Retry logic** - Built-in error handling and request retries
- 📝 **Comprehensive logging** - Detailed logs for monitoring and debugging
- ⚡ **Fast execution** - Optimized for quick data extraction

## Currently Supported Sites

- **LMArena** (`https://lmarena.ai/leaderboard`) - Text, WebDev, Vision, Search, Copilot, and Text-to-Image categories

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-news-crawler

# Install dependencies
npm install
```

## Usage

### Basic Commands

```bash
# Crawl LMArena (default)
npm run crawl

# Crawl LMArena specifically
npm run crawl:lmarena

# Crawl all available sites
npm run crawl:all

# Show help
node src/index.js --help

# List available sites
node src/index.js --list
```

### Advanced Usage

```bash
# Crawl specific site
node src/index.js --site=lmarena

# Crawl all sites
node src/index.js --all

# Enable debug logging
DEBUG=1 npm run crawl
```

## Output Format

The crawler saves data in two formats:
- **Timestamped file**: `data/lmarena-2025-06-30-23-47-00.json`
- **Latest file**: `data/lmarena-latest.json`

### JSON Structure

```json
{
  "site": "lmarena",
  "timestamp": "2025-06-30T15:47:00.000Z",
  "categories": {
    "text": {
      "lastUpdated": "2 days ago",
      "models": [
        {
          "rank": 1,
          "name": "gemini-2.5-pro",
          "score": 1467,
          "votes": 12327,
          "url": "https://aistudio.google.com/app/prompts/new_chat?model=gemini-2.5-pro"
        }
      ]
    },
    "webdev": { /* similar structure */ },
    "vision": { /* similar structure */ }
  },
  "overallRankings": [
    {
      "rank": 1,
      "model": "gemini-2.5-pro",
      "scores": {
        "overall": 1,
        "hardPrompts": 1,
        "coding": 1,
        "math": 1,
        "creativeWriting": 1,
        "instructionFollowing": 1,
        "longerQuery": 1,
        "multiTurn": 1
      }
    }
  ],
  "metadata": {
    "crawlDuration": 5432,
    "totalModels": 45,
    "lastUpdated": null
  }
}
```

## GitHub Actions Integration

The crawler is designed to work seamlessly in GitHub Actions:

```yaml
name: Crawl LLM Leaderboards

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run crawler
        run: npm run crawl:all
        
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: leaderboard-data
          path: data/
```

## Project Structure

```
ai-news-crawler/
├── package.json              # Dependencies and scripts
├── README.md                 # This file
├── src/
│   ├── index.js             # Main entry point
│   ├── config/
│   │   └── sites.js         # Site configurations
│   ├── crawlers/
│   │   ├── base-crawler.js  # Abstract base crawler
│   │   └── lmarena-crawler.js # LMArena implementation
│   └── utils/
│       ├── file-manager.js  # JSON file operations
│       └── logger.js        # Logging utilities
└── data/                    # Output directory (created automatically)
```

## Adding New Sites

To add support for a new leaderboard site:

1. **Add site configuration** in `src/config/sites.js`:
```javascript
newSite: {
  name: "New Site",
  baseUrl: "https://example.com",
  leaderboardUrl: "https://example.com/leaderboard"
}
```

2. **Create crawler implementation** in `src/crawlers/new-site-crawler.js`:
```javascript
const BaseCrawler = require('./base-crawler');

class NewSiteCrawler extends BaseCrawler {
  async processPage($, url) {
    // Implement site-specific extraction logic
  }
}

module.exports = NewSiteCrawler;
```

3. **Register crawler** in `src/index.js`:
```javascript
const NewSiteCrawler = require('./crawlers/new-site-crawler');

class CrawlerManager {
  constructor() {
    this.crawlers = {
      lmarena: LMArenaCrawler,
      newSite: NewSiteCrawler  // Add here
    };
  }
}
```

## Environment Variables

- `DEBUG=1` - Enable debug logging for detailed output

## Requirements

- Node.js 16.0.0 or higher
- No browser dependencies (uses headless mode only)

## License

MIT License
