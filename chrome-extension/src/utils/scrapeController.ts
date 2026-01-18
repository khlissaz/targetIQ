class ScrapeController {
  private _running = false;
  private _paused = false;

  start() {
    this._running = true;
    this._paused = false;
    console.log("🟢 Scraping started");
  }

  stop() {
    this._running = false;
    this._paused = false;
    console.log("🛑 Scraping stopped");
  }

  pause() {
    this._paused = true;
    console.log("⏸ Scraping paused");
  }

  resume() {
    this._paused = false;
    console.log("▶ Scraping resumed");
  }

  get running() {
    return this._running;
  }

  get paused() {
    return this._paused;
  }

  async waitIfPaused() {
    while (this._paused && this._running) {
      await new Promise((res) => setTimeout(res, 500));
    }
  }
}

export const scrapeController = new ScrapeController();
