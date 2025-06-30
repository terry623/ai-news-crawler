const BaseCrawler = require("./base-crawler");
const Logger = require("../utils/logger");

class SWEBenchCrawler extends BaseCrawler {
  async processPage($, url) {
    Logger.info("Processing SWE-Bench leaderboard page");

    // Extract the main leaderboard table
    await this.extractLeaderboard($);

    Logger.info(
      `Extracted ${this.results.overallRankings.length} model rankings`
    );
  }

  async extractLeaderboard($) {
    // Find the main leaderboard table
    const leaderboardTable = $("table").first();

    if (leaderboardTable.length === 0) {
      Logger.warn("Leaderboard table not found");
      return;
    }

    const models = [];
    const overallRankings = [];

    // Process table rows (skip header row)
    const rows = leaderboardTable.find("tbody tr, tr").slice(1);

    Logger.info(`Found ${rows.length} model entries in leaderboard`);

    rows.each((i, row) => {
      const $row = $(row);
      const cells = $row.find("td");

      if (cells.length < 4) {
        Logger.debug(
          `Skipping row ${i + 1}: insufficient columns (${cells.length})`
        );
        return;
      }

      try {
        const modelData = this.extractModelData(cells, $);
        if (modelData) {
          models.push(modelData);
          overallRankings.push(modelData.name);
          Logger.debug(
            `Extracted model: ${modelData.name} (Rank ${modelData.rank})`
          );
        }
      } catch (error) {
        Logger.warn(`Error processing row ${i + 1}:`, error.message);
      }
    });

    // Store results in the standard format
    this.results.categories.main = {
      models: models,
    };

    Logger.info(
      `Successfully extracted ${models.length} models from SWE-Bench leaderboard`
    );
  }

  extractModelData(cells, $) {
    // Extract data from table cells
    // Expected columns: Rank, Model, Resolved Rate (%), Resolved Rate SEM (±), pass@5 (%)

    const rank = this.parseRank($(cells[0]).text());
    const name = this.cleanText($(cells[1]).text());
    const resolvedRateText = $(cells[2]).text();
    const resolvedRateSEMText = $(cells[3]).text();
    const pass5RateText = cells.length > 4 ? $(cells[4]).text() : "";

    if (!name || name === "N/A") {
      return null;
    }

    // Parse percentage values
    const resolvedRate = this.parsePercentage(resolvedRateText);
    const resolvedRateSEM = this.parsePercentage(resolvedRateSEMText);
    const pass5Rate = this.parsePercentage(pass5RateText);

    return name;
  }

  parsePercentage(text) {
    if (!text || text.trim() === "" || text.includes("N/A")) {
      return null;
    }

    // Extract percentage value (handle formats like "56.5%", "±1.87%")
    const match = text.match(/([\d.]+)%/);
    if (match) {
      return parseFloat(match[1]);
    }

    // Try to parse as plain number
    const number = parseFloat(text.replace(/[^\d.-]/g, ""));
    return isNaN(number) ? null : number;
  }

  parseRank(text) {
    if (!text) return 0;

    // Handle rank text (could be just number or formatted)
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  cleanText(text) {
    if (!text) return "";

    return text.trim().replace(/\s+/g, " ").replace(/\n/g, " ").trim();
  }
}

module.exports = SWEBenchCrawler;
