import { LeadI } from "../../types";
import { scrapeMissingData } from "./scrapeComments";
import { scrapeController } from "@/utils/scrapeController";

export async function scrapeSearchPeople(): Promise<LeadI[]> {
  scrapeController.start();
  console.log("🔍 Starting scrapeSearchPeople...");

  await autoScroll();

  // Updated selector to match current LinkedIn search result cards
  const peopleCards = Array.from(
    document.querySelectorAll(
      'li.reusable-search__result-container, div[data-view-name="search-entity-result-universal-template"], a[componentkey], a[tabindex="0"] '
    )
  );

  console.log(`🟢 Found ${peopleCards.length} people results.`);

  const leads: LeadI[] = [];

  for (let i = 0; i < peopleCards.length; i++) {
      if (!scrapeController.running) {
    console.warn("🟡 Scraping stopped by user.");
    break;
  }

  await scrapeController.waitIfPaused();
  const card = peopleCards[i];

  const name =
    card.querySelector('a[data-test-app-aware-link] span')?.textContent?.trim() ||  card.textContent?.trim() || "N/A";

  const profileLink =
    (card.querySelector('a[data-test-app-aware-link]') as HTMLAnchorElement)?.href || card.getAttribute("href") || "N/A";

  const caption =
    card.querySelector(".wXtpltQEvNFyThYJIOxcPUuCwkdTqAVpw")?.textContent?.trim() ||
    card.querySelector(".entity-result__primary-subtitle")?.textContent?.trim() ||
    card.querySelector("p strong span")?.textContent?.trim() || "N/A";

  const picture =
    (card.querySelector(".ivm-view-attr__img-wrapper img") as HTMLImageElement)?.src ||
    "N/A";

  // --- IGNORE deactivated members ---
  // if (!profileLink.toLowerCase().includes("SWITCH_SEARCH_VERTICAL")) {
  //   console.log(`⚪ Skipping deactivated or anonymous member: ${name}`);
  //   continue;
  // }

  if(name === "N/A" || name === "" || profileLink.toLowerCase().includes("SWITCH_SEARCH_VERTICAL") || profileLink === "") {
    console.log(`⚪ Skipping invalid entry at index ${i}.`);
    break;
  }
  const lead: LeadI = {
    name,
    profileLink,
    picture,
    caption,
    sourceLink: window.location.href,
    type: "search_persons",
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
        payload: { type: "search_persons", index: i, total: peopleCards.length, data: lead },
      },
      "*"
    );
  } catch (err) {
    console.warn("⚠️ scrapeSearchPeople error:", err);
  }

  await delay(400);
}


  console.log("✅ Finished scraping search people:", leads.length);
  return leads;
}

// Auto-scroll to load all results
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

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
