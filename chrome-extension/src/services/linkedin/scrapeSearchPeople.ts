import { LeadI } from "../../types";
import { scrapeMissingData } from "./scrapeComments";
import { scrapeController } from "@/utils/scrapeController";


export async function scrapeSearchPeople(): Promise<LeadI[]> {
  scrapeController.start();
  console.log("🔍 Starting scrapeSearchPeople...");
  let leads: LeadI[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && scrapeController.running) {
    await autoScroll();
    // Updated selector to match current LinkedIn search result cards
    const peopleCards = Array.from(
      document.querySelectorAll(
        'div[data-view-name="people-search-result"]'
      )
    ).filter(card =>
    card.getAttribute('data-view-name') === 'people-search-result' &&
    !card.querySelector('p, a')?.textContent?.trim().toLowerCase().startsWith('linkedin member') &&
    card.getAttribute('data-view-name') !== 'premium-upsell-card'
  );
    console.log(`🟢 [Page ${page}] Found ${peopleCards.length} people results.`);
    for (let i = 0; i < peopleCards.length; i++) {
      if (!scrapeController.running) {
        console.warn("🟡 Scraping stopped by user.");
        hasNext = false;
        break;
      }
      await scrapeController.waitIfPaused();
      const card = peopleCards[i];
      const name = card.querySelector('a[data-test-app-aware-link] span, div[data-view-name="search-entity-result-universal-template"] h3, p a[data-view-name="search-result-lockup-title"]')?.textContent?.trim() || card.textContent?.trim() || "N/A";
      const profileLink = (card.querySelector('a[data-test-app-aware-link],p a[data-view-name="search-result-lockup-title"]') as HTMLAnchorElement)?.href || card.getAttribute("href") || "N/A";
      // const caption = card.querySelector(".wXtpltQEvNFyThYJIOxcPUuCwkdTqAVpw")?.textContent?.trim() || card.querySelector(".entity-result__primary-subtitle")?.textContent?.trim() || card.querySelector("p strong span")?.textContent?.trim() || "N/A";
      const picture = (card.querySelector(".ivm-view-attr__img-wrapper img, figure img") as HTMLImageElement)?.src || "N/A";
      if (
        name === "N/A" ||
        name === ""
      ) {
        console.log(`⚪ Skipping invalid entry at index ${i}.`);
        continue;
      }
      const lead: LeadI = {
        name,
        profileLink,
        picture,
        // caption,
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
    // Human-like pagination: scroll, wait, and click next page if available
    const paginated = await goToNextPageHumanLike();
    if (paginated) {
      page++;
    } else {
      hasNext = false;
    }
  // Human-like pagination logic
  async function goToNextPageHumanLike(): Promise<boolean> {
    // Scroll to bottom to load pagination controls
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await delay(500 + Math.random() * 500);

    // Wait for the active page button
    const activeItem = await waitForElement(document.body, '.artdeco-pagination ul > li.active', 4000);
    if (!activeItem) return false;

    // Find the next page button
    const nextButton = activeItem.nextElementSibling?.querySelector('button') as HTMLButtonElement | null;
    if (!nextButton || nextButton.disabled) return false;

    // Random human-like pause before clicking
    await delay(800 + Math.random() * 1200);
    nextButton.click();

    // Wait for the results to change
    await waitForPageLoad();

    // Random pause after page load
    await delay(600 + Math.random() * 1000);
    return true;
  }

  // Helper: Wait for a selector to appear
  async function waitForElement(root: ParentNode, selector: string, timeout = 4000): Promise<Element | null> {
    return new Promise(resolve => {
      const el = root.querySelector(selector);
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const found = root.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(root, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  // Helper: Wait for the search results container to change
  async function waitForPageLoad(timeout = 6000): Promise<void> {
    return new Promise(resolve => {
      const target = document.querySelector('.search-results-container');
      if (!target) return resolve();
      const initialHTML = target.innerHTML;
      const observer = new MutationObserver(() => {
        if (target.innerHTML !== initialHTML) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(target, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }
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
