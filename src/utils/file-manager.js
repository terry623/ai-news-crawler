const fs = require("fs").promises;
const path = require("path");

class FileManager {
  constructor(dataDir = "data") {
    this.dataDir = dataDir;
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async saveJSON(filename, data) {
    await this.ensureDataDirectory();
    const filePath = path.join(this.dataDir, filename);
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, "utf8");
    return filePath;
  }

  async loadJSON(filename) {
    const filePath = path.join(this.dataDir, filename);
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  generateFilename(siteName, timestamp = new Date()) {
    const dateStr = timestamp.toISOString().split("T")[0];
    const timeStr = timestamp
      .toISOString()
      .split("T")[1]
      .split(".")[0]
      .replace(/:/g, "-");
    return `${siteName}-${dateStr}-${timeStr}.json`;
  }

  generateLatestFilename(siteName) {
    return `${siteName}-latest.json`;
  }
}

module.exports = FileManager;
