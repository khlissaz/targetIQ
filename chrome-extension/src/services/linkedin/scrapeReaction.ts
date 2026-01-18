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
    let hasMore = true;
    let batchCount = 0;

    while (batchCount < maxScrapes && hasMore && scrapeController.running) {
      const reactionsList = reactionsContainer.querySelectorAll(
        '[data-view-name="view-likers"], .feed-shared-reaction__actor, li.social-details-reactors-tab-body-list-item, ul.artdeco-list li, li.artdeco-list__item'
      );

      for (let i = 0; i < reactionsList.length; i++) {
        if (!scrapeController.running) break;

        const item = reactionsList[i];
        const reaction = extractReactionData(item, postUrl);
        if (!reaction) continue;

        // ✅ Skip duplicates
        if (seenProfiles.has(reaction.profileLink)) continue;
        seenProfiles.add(reaction.profileLink);

        // ✅ Load extended info (with random throttling)
        const missingData = await scrapeMissingData(reaction.profileLink);
        Object.assign(reaction, missingData);
        scrapedReactions.push(reaction);
        batchCount++;

        // ✅ Notify popup/UI progressively
        window.postMessage(
          {
            source: "scraper",
            type: "SCRAPE_PROGRESS",
            payload: {
              type: "reactions",
              index: i + 1,
              total: reactionsList.length,
              data: reaction,
            },
          },
          "*"
        );

        // 🕒 Random human delay (1–4s)
        await humanDelay(1000, 4000);

        // 💤 Take a long break every 25 profiles
        if (batchCount % 25 === 0) {
          console.log("⏸️ Cooling down to stay under LinkedIn radar...");
          await humanDelay(30000, 60000);
        }
      }
      await incrementScrapeCount(1);

      // 🖱️ Click "See more" if available, otherwise stop
      hasMore = await clickSeeMoreButton(reactionsContainer);

      // 🕐 Long natural pause between scrolls
      await humanDelay(2000, 5000);
    }

    console.log(
      `✅ Finished scraping ${scrapedReactions.length} unique reactions.`
    );

    // if (batchCount > 0) {
    //   await incrementScrapeCount(batchCount);
    // }
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
