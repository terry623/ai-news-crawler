const Logger = require("./utils/logger");
const sites = require("./config/sites");
const LMArenaCrawler = require("./crawlers/lmarena-crawler");

class CrawlerManager {
  constructor() {
    this.crawlers = {
      lmarena: LMArenaCrawler,
    };
  }

  async crawlSite(siteName) {
    const siteConfig = sites[siteName];
    if (!siteConfig) {
      throw new Error(`Site configuration not found for: ${siteName}`);
    }

    const CrawlerClass = this.crawlers[siteName];
    if (!CrawlerClass) {
      throw new Error(`Crawler not implemented for: ${siteName}`);
    }

    Logger.info(`Starting crawl for ${siteConfig.name}`);
    const crawler = new CrawlerClass(siteConfig);
    const results = await crawler.crawl();

    Logger.success(`Successfully crawled ${siteConfig.name}`);
    Logger.info(
      `Categories found: ${Object.keys(results.categories).join(", ")}`
    );

    return results;
  }

  async crawlAll() {
    const results = {};
    const availableSites = Object.keys(this.crawlers);

    Logger.info(`Starting crawl for all sites: ${availableSites.join(", ")}`);

    for (const siteName of availableSites) {
      try {
        results[siteName] = await this.crawlSite(siteName);
      } catch (error) {
        Logger.error(`Failed to crawl ${siteName}:`, error.message);
        results[siteName] = { error: error.message };
      }
    }

    return results;
  }

  listAvailableSites() {
    return Object.keys(sites);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const manager = new CrawlerManager();

  try {
    if (args.includes("--help") || args.includes("-h")) {
      console.log(`
AI News Crawler - LLM Leaderboard Scraper

Usage:
  npm run crawl                    # Crawl LMArena (default)
  npm run crawl:lmarena           # Crawl LMArena specifically
  npm run crawl:all               # Crawl all available sites
  node src/index.js --site=<name> # Crawl specific site
  node src/index.js --all         # Crawl all sites
  node src/index.js --list        # List available sites

Available sites: ${manager.listAvailableSites().join(", ")}

Options:
  --site=<name>  Crawl specific site
  --all          Crawl all available sites
  --list         List available sites
  --help, -h     Show this help message

Environment variables:
  DEBUG=1        Enable debug logging
      `);
      return;
    }

    if (args.includes("--list")) {
      console.log("Available sites:");
      manager.listAvailableSites().forEach((site) => {
        console.log(`  - ${site}: ${sites[site].name}`);
      });
      return;
    }

    let results;

    if (args.includes("--all")) {
      results = await manager.crawlAll();
    } else {
      // Check for --site argument
      const siteArg = args.find((arg) => arg.startsWith("--site="));
      const siteName = siteArg ? siteArg.split("=")[1] : "lmarena"; // Default to lmarena

      results = await manager.crawlSite(siteName);
    }

    Logger.success("Crawling completed successfully!");

    if (process.env.DEBUG) {
      console.log("\nResults summary:", JSON.stringify(results, null, 2));
    }
  } catch (error) {
    Logger.error("Crawling failed:", error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { CrawlerManager, main };
