const sites = {
  lmarena: {
    name: "LMArena",
    baseUrl: "https://lmarena.ai",
    leaderboardUrl: "https://lmarena.ai/leaderboard",
    categories: [
      { name: "text", selector: 'section:has(h2:contains("Text"))' },
      { name: "webdev", selector: 'section:has(h2:contains("WebDev"))' },
      { name: "vision", selector: 'section:has(h2:contains("Vision"))' },
      { name: "search", selector: 'section:has(h2:contains("Search"))' },
      { name: "copilot", selector: 'section:has(h2:contains("Copilot"))' },
      {
        name: "textToImage",
        selector: 'section:has(h2:contains("Text-to-Image"))',
      },
    ],
  },
  swebench: {
    name: "SWE-Bench",
    baseUrl: "https://swe-rebench.com",
    leaderboardUrl: "https://swe-rebench.com/leaderboard",
  },
  // Future sites can be added here
  // llmStats: {
  //   name: 'LLM Stats',
  //   baseUrl: 'https://llm-stats.com',
  //   leaderboardUrl: 'https://llm-stats.com/leaderboard'
  // }
};

module.exports = sites;
