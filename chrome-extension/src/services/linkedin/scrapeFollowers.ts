import { scrapeController } from "@/utils/scrapeController";
import { LeadI } from "../../types";
import { scrapeMissingData } from "./scrapeComments";

/**
 * Scrape followers from a profile's followers page.
 */
export async function scrapeFollowers(): Promise<LeadI[]> {
  scrapeController.start();
  console.log("🔍 Starting scrapeFollowers...");

  await autoScroll();

  // Updated selector for followers cards
  const followerCards = Array.from(
    document.querySelectorAll<HTMLElement>(
      'li.reusable-search__result-container, div[data-view-name="search-entity-result-universal-template"]'
    )
  );

  console.log(`🟢 Found ${followerCards.length} followers.`);

  const leads: LeadI[] = [];

  for (let i = 0; i < followerCards.length; i++) {
    const card = followerCards[i];

    const name =
      card.querySelector('a[data-test-app-aware-link] span')?.textContent?.trim() || "N/A";

    const profileLink =
      (card.querySelector('a[data-test-app-aware-link]') as HTMLAnchorElement)?.href ||
      "N/A";

    const caption =
      card.querySelector(".wXtpltQEvNFyThYJIOxcPUuCwkdTqAVpw")?.textContent?.trim() ||
      "N/A";

    const picture =
      (card.querySelector(".ivm-view-attr__img-wrapper img") as HTMLImageElement)?.src ||
      "N/A";

      // --- IGNORE deactivated members ---
  if (!profileLink || name.toLowerCase().includes("SWITCH_SEARCH_VERTICAL")) {
    console.log(`⚪ Skipping deactivated or anonymous member: ${name}`);
    continue;
  }

    const lead: LeadI = {
      name,
      profileLink,
      picture,
      caption,
      sourceLink: window.location.href,
      type: "followers",
    };

    try {
      const missingData = await scrapeMissingData(profileLink);
      Object.assign(lead, missingData);
      await delay(500);
             if (scrapeController.running) {
      leads.push(lead);
             }
      window.postMessage(
        {
          source: "scraper",
          type: "SCRAPE_PROGRESS",
          payload: { type: "followers", 
            index: i, 
            total: followerCards.length, 
            data: lead },
        },
        "*"
      );
    } catch (err) {
      console.warn("⚠️ scrapeFollowers error:", err);
    }

    await delay(400);
  }

  console.log("✅ Finished scraping followers:", leads.length);
  return leads;
}

// Utility: Auto-scroll to load all results
async function autoScroll(): Promise<void> {
  let prevHeight = 0;
  while (true) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    await delay(1500);
    const currHeight = document.body.scrollHeight;
    if (currHeight === prevHeight) break;
    prevHeight = currHeight;
  }
}

// Utility: Delay
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
