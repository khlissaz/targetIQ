import { scrapeController } from "../../utils/scrapeController";
import { LeadI } from "../../types";
import { scrapeMissingData } from "./scrapeComments";
import { getScrapingLimit, incrementScrapeCount } from "../apiClient";

/**
 * Smart, anti-block LinkedIn reaction scraper
 */
export async function scrapeAndScrollReactions(
  postUrl: string,
  reactionsContainer: HTMLElement
): Promise<LeadI[]> {
  if (!postUrl || !reactionsContainer) return [];
  console.log(`[Scrape] Starting to scrape reactions from: ${postUrl}`);
  scrapeController.start();

  const scrapedReactions: LeadI[] = [];
  const seenProfiles = new Set<string>(); // ✅ Cache to avoid re-scraping
  let dailyLimit = 0, dailyUsage = 0, maxScrapes = 0;

  try {
    ({ dailyLimit, dailyUsage } = await getScrapingLimit());
    console.log(`[Scrape] User scraping limit: ${dailyLimit}, used today: ${dailyUsage}`);
    maxScrapes = dailyLimit === -1 ? Infinity : dailyLimit - dailyUsage;
    console.log(
      `[Scrape] Daily scraping limit: ${dailyLimit}, used: ${dailyUsage}, max for this session: ${maxScrapes}`
    );
    if (maxScrapes <= 0) {
      console.log(`[Scrape] Daily limit reached. Skipping reactions.`);
      return [];
    }
  } catch (err) {
    console.error("❌ Error fetching scraping limit:", err);
  }
 
  try {
    let batchCount = 0;
    let running = true;
    const selector = '[data-view-name="view-likers"], .feed-shared-reaction__actor, li.social-details-reactors-tab-body-list-item, ul.artdeco-list li, li.artdeco-list__item';

    // Helper to scrape a single item if not seen
    const scrapeItem = async (item: Element) => {
      if (!scrapeController.running || !running) return;
      const reaction = extractReactionData(item, postUrl);
      if (!reaction) return;
      if (seenProfiles.has(reaction.profileLink)) return;
      seenProfiles.add(reaction.profileLink);
      const missingData = await scrapeMissingData(reaction.profileLink);
      Object.assign(reaction, missingData);
      scrapedReactions.push(reaction);
      batchCount++;
      window.postMessage(
        {
          source: "scraper",
          type: "SCRAPE_PROGRESS",
          payload: {
            type: "reactions",
            index: batchCount,
            total: scrapedReactions.length,
            data: reaction,
          },
        },
        "*"
      );
      await humanDelay(1000, 4000);
      if (batchCount % 25 === 0) {
        console.log("⏸️ Cooling down to stay under LinkedIn radar...");
        await humanDelay(30000, 60000);
      }
    };

    // Scrape any already visible items
    const initialList = Array.from(reactionsContainer.querySelectorAll(selector));
    for (const item of initialList) {
      if (batchCount >= maxScrapes) break;
      await scrapeItem(item);
    }

    // Set up MutationObserver for incremental scraping
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof Element)) continue;
          if (node.matches && node.matches(selector)) {
            if (batchCount >= maxScrapes) {
              running = false;
              observer.disconnect();
              break;
            }
            await scrapeItem(node);
          } else if (node.querySelectorAll) {
            const newItems = node.querySelectorAll(selector);
            for (const item of Array.from(newItems)) {
              if (batchCount >= maxScrapes) {
                running = false;
                observer.disconnect();
                break;
              }
              await scrapeItem(item);
            }
          }
        }
      }
    });
    observer.observe(reactionsContainer, { childList: true, subtree: true });

    // Improved: Keep clicking "See more" or scrolling until no new items for a while

    let hasMore = true;
    let lastItemCount = reactionsContainer.querySelectorAll(selector).length;
    let idleTries = 0;
    const maxIdleTries = 8; // ~40s if delay is 5s
    await autoScrollAndScrape(
      reactionsContainer,
      selector,
      () => batchCount,
      maxScrapes,
      () => running,
      scrapeController
    );
// Automatically scroll and scrape loaded reactions
// Improved: autoScrollAndScrape checks latest batchCount and running state
async function autoScrollAndScrape(container, selector, getBatchCount, maxScrapes, getRunning, scrapeController) {
  let lastItemCount = container.querySelectorAll(selector).length;
  let idleTries = 0;
  const maxIdleTries = 12; // ~60s if delay is 5s
  while (getBatchCount() < maxScrapes && scrapeController.running && getRunning() && idleTries < maxIdleTries) {
    container.scrollTop = container.scrollHeight;
    await clickSeeMoreButton(container);
    const newCount = await waitForNewItems(container, selector, lastItemCount, 7000);
    if (newCount > lastItemCount) {
      lastItemCount = newCount;
      idleTries = 0;
    } else {
      idleTries++;
    }
    await humanDelay(1000, 2000);
  }
}
// Wait for new items to appear in the container
async function waitForNewItems(container: HTMLElement, selector: string, prevCount: number, timeout: number): Promise<number> {
  const start = Date.now();
  return new Promise((resolve) => {
    function check() {
      const count = container.querySelectorAll(selector).length;
      if (count > prevCount) {
        resolve(count);
      } else if (Date.now() - start > timeout) {
        resolve(count);
      } else {
        setTimeout(check, 300);
      }
    }
    check();
  });
}

    running = false;
    observer.disconnect();
    await incrementScrapeCount(batchCount);

    console.log(`✅ Finished scraping ${scrapedReactions.length} unique reactions.`);
    window.postMessage(
      {
        source: "scraper",
        type: "SCRAPE_DONE",
        payload: {
          type: "reactions",
          total: scrapedReactions.length,
          data: scrapedReactions,
        },
      },
      "*"
    );
    return scrapedReactions;
  } catch (error) {
    console.error("❌ Error during scraping:", error);
    return scrapedReactions;
  }
}

/* --------------------------- Helper Functions --------------------------- */
function extractReactionData(item: Element, postUrl: string): LeadI | null {
  const ps = item.querySelectorAll("p");
  const firstText =
    item.querySelector("span.text-view-model")?.textContent?.trim() ||
    ps[0]?.textContent?.trim() ||
    item.querySelector("div.artdeco-entity-lockup__title")?.textContent?.trim() || '';

  const secondText =
    item
      .querySelector("div.artdeco-entity-lockup__caption")
      ?.textContent?.trim() ||
    ps[1]?.textContent?.trim() ||
    item.querySelector("span.text-view-model--secondary")?.textContent?.trim() ||
    "";

  const profileLink =
    item.querySelector("a")?.getAttribute("href") ||
    item.getAttribute("href") ||
    "";

  const reaction: LeadI = {
    name: firstText || "",
    type: "reaction",
    profileLink,
    picture:
      item
        .querySelector("div.ivm-image-view-model>div>img, img")
        ?.getAttribute("src") || "",
    caption: secondText || "",
    reactionType:
      item
        .querySelector("img.reactions-icon")
        ?.getAttribute("data-test-reactions-icon-type") || "Unknown",
    sourceLink: postUrl,
  };

  return reaction.name ? reaction : null;
}

function humanDelay(min: number, max: number): Promise<void> {
  const delayTime = Math.random() * (max - min) + min;
  return new Promise((resolve) => setTimeout(resolve, delayTime));
}

async function clickSeeMoreButton(container: HTMLElement): Promise<boolean> {
  const btn = container.querySelector("._6f7bab93.e363551a button");
  if (btn) {
    console.log("🖱️ Clicking 'See more'...");
    (btn as HTMLButtonElement).click();
    await humanDelay(2000, 4000);
    return true;
  }
  return false;
}
