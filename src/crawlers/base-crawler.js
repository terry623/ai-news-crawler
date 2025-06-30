const { CheerioCrawler } = require("crawlee");
const Logger = require("../utils/logger");
const FileManager = require("../utils/file-manager");

class BaseCrawler {
  constructor(siteConfig) {
    this.siteConfig = siteConfig;
    this.fileManager = new FileManager();
    this.crawler = null;
    this.results = {
      site: siteConfig.name.toLowerCase(),
      timestamp: new Date().toISOString(),
      categories: {},
      overallRankings: [],
      metadata: {
        crawlDuration: 0,
        totalModels: 0,
        lastUpdated: null,
      },
    };
  }

  async initializeCrawler() {
    this.crawler = new CheerioCrawler({
      requestHandler: async ({ request, $ }) => {
        Logger.info(`Processing ${request.url}`);
        await this.processPage($, request.url);
      },
      failedRequestHandler: async ({ request, error }) => {
        Logger.error(`Request failed for ${request.url}:`, error.message);
      },
      maxRequestRetries: 3,
      requestHandlerTimeoutSecs: 60,
    });
  }

  async processPage($, url) {
    // To be implemented by subclasses
    throw new Error("processPage method must be implemented by subclasses");
  }

  async crawl() {
    const startTime = Date.now();
    Logger.info(`Starting crawl for ${this.siteConfig.name}`);

    try {
      await this.initializeCrawler();
      await this.crawler.run([this.siteConfig.leaderboardUrl]);

      this.results.metadata.crawlDuration = Date.now() - startTime;
      this.results.metadata.totalModels = this.countTotalModels();

      await this.saveResults();
      Logger.success(
        `Crawl completed for ${this.siteConfig.name} in ${this.results.metadata.crawlDuration}ms`
      );

      return this.results;
    } catch (error) {
      Logger.error(`Crawl failed for ${this.siteConfig.name}:`, error.message);
      throw error;
    }
  }

  countTotalModels() {
    let total = 0;
    Object.values(this.results.categories).forEach((category) => {
      if (category.models) {
        total += category.models.length;
      }
    });
    return total;
  }

  async saveResults() {
    const timestamp = new Date(this.results.timestamp);
    const timestampedFilename = this.fileManager.generateFilename(
      this.results.site,
      timestamp
    );
    const latestFilename = this.fileManager.generateLatestFilename(
      this.results.site
    );

    // Save timestamped version
    const timestampedPath = await this.fileManager.saveJSON(
      timestampedFilename,
      this.results
    );
    Logger.info(`Results saved to ${timestampedPath}`);

    // Save latest version
    const latestPath = await this.fileManager.saveJSON(
      latestFilename,
      this.results
    );
    Logger.info(`Latest results saved to ${latestPath}`);

    return { timestampedPath, latestPath };
  }

  // Utility methods for parsing
  parseNumber(text) {
    if (!text) return 0;
    return parseInt(text.replace(/,/g, "")) || 0;
  }

  parseRank(text) {
    if (!text) return 0;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  cleanText(text) {
    return text ? text.trim().replace(/\s+/g, " ") : "";
  }

  extractUrl(element) {
    const href = element.attr("href");
    if (!href) return null;

    // Handle relative URLs
    if (href.startsWith("/")) {
      return this.siteConfig.baseUrl + href;
    }
    return href;
  }
}

module.exports = BaseCrawler;
