const BaseCrawler = require("./base-crawler");
const Logger = require("../utils/logger");

class LMArenaCrawler extends BaseCrawler {
  async processPage($, url) {
    Logger.info("Processing LMArena leaderboard page");

    // Extract category leaderboards
    await this.extractCategoryLeaderboards($);

    // Extract overall rankings table
    await this.extractOverallRankings($);

    Logger.info(
      `Extracted ${Object.keys(this.results.categories).length} categories`
    );
  }

  async extractCategoryLeaderboards($) {
    // Find all category sections
    const categorySections = $("div").filter((i, el) => {
      const $el = $(el);
      const hasHeading = $el.find("h2, h3").length > 0;
      const hasTable = $el.find("table, .rank, .model").length > 0;
      return hasHeading && hasTable;
    });

    Logger.info(`Found ${categorySections.length} potential category sections`);

    categorySections.each((i, section) => {
      const $section = $(section);
      const heading = $section.find("h2, h3").first().text().trim();

      if (this.isCategorySection(heading)) {
        const categoryName = this.normalizeCategoryName(heading);
        Logger.info(`Processing category: ${categoryName}`);

        const categoryData = this.extractCategoryData($section, $);
        if (categoryData && categoryData.models.length > 0) {
          this.results.categories[categoryName] = categoryData;
        }
      }
    });
  }

  isCategorySection(heading) {
    const categoryKeywords = [
      "text",
      "webdev",
      "vision",
      "search",
      "copilot",
      "text-to-image",
    ];
    const normalizedHeading = heading.toLowerCase();
    return categoryKeywords.some((keyword) =>
      normalizedHeading.includes(keyword)
    );
  }

  normalizeCategoryName(heading) {
    const mapping = {
      text: "text",
      webdev: "webdev",
      vision: "vision",
      search: "search",
      copilot: "copilot",
      "text-to-image": "textToImage",
    };

    const normalizedHeading = heading.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (normalizedHeading.includes(key)) {
        return value;
      }
    }
    return normalizedHeading.replace(/[^a-z0-9]/g, "");
  }

  extractCategoryData($section, $) {
    const models = [];
    let lastUpdated = null;

    // Try to find last updated info
    const updateText = $section
      .find("*")
      .filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes("ago") || text.includes("updated");
      })
      .first()
      .text()
      .trim();

    if (updateText) {
      lastUpdated = updateText;
    }

    // Look for model entries in various formats
    const modelElements = $section.find("a").filter((i, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const text = $el.text().trim();

      // Filter for model links (exclude navigation links)
      return (
        href &&
        text &&
        !href.includes("/leaderboard") &&
        !href.includes("discord") &&
        !href.includes("twitter") &&
        !href.includes("github") &&
        text.length > 2
      );
    });

    modelElements.each((i, el) => {
      const $el = $(el);
      const modelData = this.extractModelFromElement($el, $);
      if (modelData) {
        models.push(modelData);
      }
    });

    // If no models found with links, try to extract from table rows or other structures
    if (models.length === 0) {
      const tableRows = $section.find("tr").slice(1); // Skip header row
      tableRows.each((i, row) => {
        const modelData = this.extractModelFromTableRow($(row), $);
        if (modelData) {
          models.push(modelData);
        }
      });
    }

    return {
      lastUpdated,
      models: models.slice(0, 10), // Limit to top 10 for each category
    };
  }

  extractModelFromElement($el, $) {
    const name = this.cleanText($el.text());
    const url = this.extractUrl($el);

    if (!name || name.length < 2) return null;

    // Try to find rank, score, and votes in nearby elements
    const $parent = $el.closest("div, td, li");
    const parentText = $parent.text();

    // Look for numbers that could be rank, score, votes
    const numbers = parentText.match(/\d{1,4}(?:,\d{3})*/g) || [];

    let rank = 0,
      score = 0,
      votes = 0;

    // Try to extract rank from context
    const rankMatch = parentText.match(/(?:^|\s)(\d{1,2})(?:\s|$)/);
    if (rankMatch) {
      rank = parseInt(rankMatch[1]);
    }

    // Extract score and votes from numbers found
    if (numbers.length >= 2) {
      score = this.parseNumber(numbers[0]);
      votes = this.parseNumber(numbers[1]);
    }

    return {
      rank: rank || 0,
      name,
      score,
      votes,
      url,
    };
  }

  extractModelFromTableRow($row, $) {
    const cells = $row.find("td");
    if (cells.length < 3) return null;

    const rank = this.parseRank($(cells[0]).text());
    const nameCell = $(cells[1]);
    const name = this.cleanText(nameCell.text());
    const url = this.extractUrl(nameCell.find("a").first());
    const score = this.parseNumber($(cells[2]).text());
    const votes = cells.length > 3 ? this.parseNumber($(cells[3]).text()) : 0;

    if (!name) return null;

    return {
      rank,
      name,
      score,
      votes,
      url,
    };
  }

  async extractOverallRankings($) {
    const overallTable = $("table")
      .filter((i, table) => {
        const $table = $(table);
        const headers = $table.find("th, thead td").text().toLowerCase();
        return headers.includes("model") && headers.includes("overall");
      })
      .first();

    if (overallTable.length === 0) {
      Logger.warn("Overall rankings table not found");
      return;
    }

    const rows = overallTable.find("tbody tr, tr").slice(1); // Skip header

    rows.each((i, row) => {
      const $row = $(row);
      const cells = $row.find("td");

      if (cells.length < 3) return;

      const modelName = this.cleanText($(cells[0]).text());
      if (!modelName) return;

      const overallRank = this.parseRank($(cells[1]).text());

      // Extract scores from remaining cells
      const scores = {};
      const scoreHeaders = [
        "overall",
        "hardPrompts",
        "coding",
        "math",
        "creativeWriting",
        "instructionFollowing",
        "longerQuery",
        "multiTurn",
      ];

      cells.slice(1).each((j, cell) => {
        if (j < scoreHeaders.length) {
          scores[scoreHeaders[j]] = this.parseRank($(cell).text());
        }
      });

      this.results.overallRankings.push({
        rank: overallRank,
        model: modelName,
        scores,
      });
    });

    Logger.info(
      `Extracted ${this.results.overallRankings.length} overall rankings`
    );
  }
}

module.exports = LMArenaCrawler;
