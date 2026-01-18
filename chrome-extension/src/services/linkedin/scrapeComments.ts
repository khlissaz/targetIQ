import { scrapeController } from '../../utils/scrapeController';
import { LeadI } from '../../types';

export async function scrapeComments(post: Element): Promise<LeadI[]> {
  scrapeController.start();
  const urn = post?.getAttribute("componentKey") || post?.getAttribute("data-urn");
  console.log('urn: ', urn);
  const postUrl = urn ? `https://www.linkedin.com/feed/update/${urn}` : null;
  if (!postUrl) return [];

  console.log("💬 Starting scrapeComments for:", postUrl);

  await loadAllComments(post as HTMLElement);

  const commentEls = Array.from(
    post.querySelectorAll(
      'div[data-view-name="comment-container"], article.comments-comment-entity, div[data-id^="comment-"], div.comments-comment-item, li.comments-comment-item'
    )
  );
  console.log('commentEls lenght: ', commentEls.length);
  if (commentEls.length === 0) {
    console.warn("⚠️ No comments found.");
    return [];
  }

  console.log(`🟢 Found ${commentEls.length} comments to process.`);

  const profiles: LeadI[] = [];

  for (let index = 0; index < commentEls.length; index++) {
    const el = commentEls[index];
    const commentData = extractCommentData(el, postUrl || "");

    if (!commentData || !commentData.profileLink) {
      console.warn(`⚠️ Skipping comment ${index}: missing profile link.`);
      continue;
    }

    console.log(`🔍 Scraping profile (${index + 1}/${commentEls.length}):`, commentData.profileLink);

    try {
      const missingData = await scrapeMissingData(commentData.profileLink);
      if (missingData) Object.assign(commentData, missingData);

      console.log("💾 Final merged commentData:", commentData);
      await delay(500);
       if (scrapeController.running) {

      profiles.push(commentData);
       }

      // ✅ Send progressive updates immediately after each successful scrape
      window.postMessage(
        {
          source: "scraper",
          type: "SCRAPE_PROGRESS",
          payload: {
            type: "comments",
            index,
            total: commentEls.length,
            data: commentData,
          },
        },
        "*"
      );

      // Small delay between profiles to prevent race conditions
      await new Promise((r) => setTimeout(r, 500));

    } catch (err) {
      console.error("❌ Error scraping profile:", err);
    }
  }

  console.log("💬 Total comments scraped:", profiles.length);

  // ✅ Send final batch
  window.postMessage(
    {
      source: "scraper",
      type: "SCRAPE_DONE",
      payload: {
        type: "comments",
        total: profiles.length,
        data: profiles,
      },
    },
    "*"
  );

  return profiles;
}


function extractCommentData(comment: Element, postUrl: string): LeadI | null {
  const text =
    comment
      .querySelector('p[data-view-name="comment-commentary"], feed-shared-inline-show-more-text, .update-components-text')
      ?.textContent?.trim() || '';
  const name =
    comment
      .querySelector('a[data-view-name="comment-actor-description"] p, h3.comments-comment-meta__description span, span.comments-comment-meta__description-title, h3 span.comments-comment-meta__description-title')
      ?.textContent?.trim() || '';
  const profileLink =
    (
      comment.querySelector(
        'a[data-view-name="comment-actor-description"], .comments-comment-meta__actor a',
      ) as HTMLAnchorElement
    )?.href || '';
  const picture =
    (
      comment.querySelector(
        'a[data-view-name="comment-actor-picture"] figure img, .ivm-view-attr__img-wrapper img',
      ) as HTMLImageElement
    )?.src || '';
  const caption =
    comment
      .querySelector('a[data-view-name="comment-actor-description"] p:nth-of-type(2), .comments-comment-meta__description-subtitle')
      ?.textContent?.trim() || '';

  if (text && name) {
    return {
      sourceLink: postUrl,
      text,
      name,
      profileLink,
      picture,
      caption,
      type: 'comment',
    };
  }
  return null;
}

export const scrapeMissingData = async (profileUrl: string): Promise<Partial<LeadI>> => {
  const data: Partial<LeadI> = {};
  const iframe = createOrGetIframe();

  return new Promise((resolve) => {
    let resolved = false; // ✅ Prevent multiple resolve calls

    const cleanup = () => {
      resolved = true;
      iframe.onload = null;
    };

    const finish = (result: Partial<LeadI>) => {
      if (!resolved) {
        cleanup();
        resolve(result);
      }
    };

    console.log('🔍 Scraping profile:', profileUrl);

    const startScraping = async (doc: Document) => {
      const getText = (selector: string) =>
        doc.querySelector(selector)?.textContent?.trim() || '';

      try {
        await delay(3000);
        // Wait for essential elements to load
        const [pictureEl, nameEl, headlineEl] = await Promise.all([
          waitForElement(doc, 'img[class*="profile-picture"], img.org-top-card-primary-content__logo'),
          waitForElement(doc, '.mt2.relative h1, h1.org-top-card-summary__title'),
          waitForElement(doc, '.text-body-medium.break-words, .org-top-card-summary-info-list'),
        ]);

        const [jobEl, companyEl, locationEl] = await Promise.all([
          waitForElement(doc, 'div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div.text-body-medium.break-words'),
          waitForElement(doc, 'ul > li:nth-child(1) > button > span > div'),
          waitForElement(doc, '.text-body-small.inline.t-black--light.break-words'),
        ]);

        data.picture = pictureEl?.getAttribute('src') || '';
        data.name = nameEl?.textContent?.trim() || '';
        data.caption = headlineEl?.textContent?.trim() || '';
        data.job = jobEl?.textContent?.trim() || '';
        data.company = companyEl?.textContent?.trim() || '';
        data.location = locationEl?.textContent?.trim() || '';
        data.info = getText('div.display-flex.ph5.pv3 > div > div > div');

        // ✅ Try to open contact modal if available
        const contactButton = doc.querySelector('a[href*="contact-info"]') as HTMLElement;
        if (contactButton) {
          contactButton.click();
          await new Promise((res) => setTimeout(res, 2000));

          const modalElement = doc.querySelector('[role="dialog"]');
          if (modalElement) {
            data.email = modalElement.querySelector('a[href^="mailto:"]')?.textContent?.trim();
            data.phone = modalElement.querySelector('li > span.t-14.t-black.t-normal')?.textContent?.trim();
            data.website = modalElement.querySelector('a[href^="https:"]')?.textContent?.trim();
          }
        }

        console.log('✅ Scraped profile data:', data);
        finish(data);
      } catch (error) {
        console.warn('⚠️ scrapeMissingData error:', error);
        finish(data);
      }
    };

    const onLoad = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        finish(data);
        return;
      }

      requestIdleCallback(() => startScraping(doc));
    };

    iframe.onload = onLoad;
    iframe.src = profileUrl;
  });
};

let reusableIframe: HTMLIFrameElement | null = null;
const createOrGetIframe = (): HTMLIFrameElement => {
  if (reusableIframe && document.body.contains(reusableIframe)) {
    return reusableIframe;
  }

  const iframe = document.createElement('iframe');

  iframe.style.cssText = `
    width: 1px;
    height: 1px;
    position: absolute;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  `;

  document.body.appendChild(iframe);
  reusableIframe = iframe;
  return iframe;
};
async function loadAllComments(post: HTMLElement): Promise<void> {
  // --- Human-like random delay helper ---
  function randomDelay(min = 700, max = 1800) {
    return new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
  }
  try {
    const commentsButtonSelector =
      'button[data-view-name="feed-comment-button"], li.social-details-social-counts__comments button, button[data-control-name="comments"], button[data-test-reply-button], button[aria-label*="comment"]';
    // Step 1: Wait for the main "comments" button
    const commentsButton = (await waitForElement(post, commentsButtonSelector)) as HTMLElement;
    if (!commentsButton) {
      console.warn("⚠️ Unable to load comments — button not found.");
      return;
    }
    // Simulate human scroll and pause
    commentsButton.scrollIntoView({ behavior: "smooth", block: "center" });
    await randomDelay(800, 2000);
    if (!(await isElementClickable(commentsButton))) {
      await randomDelay(1000, 2000);
    }
    const clicked = await attemptClick(commentsButton, 3, post);
    if (!clicked) {
      console.warn("⚠️ Failed to click main comments button.");
      return;
    }
    await randomDelay(3000, 6000);
    // Step 2: Click all "Load more comments" buttons one by one with random delays
    while (true) {
      const loadMoreContainers = post.querySelectorAll('.comments-comment-list__load-more-container');
      let anyClicked = false;
      Array.from(loadMoreContainers).forEach(container => {
        const buttons = container.querySelectorAll('button');
        Array.from(buttons).forEach(btn => {
          if (btn instanceof HTMLButtonElement && !btn.disabled) {
            btn.scrollIntoView({ behavior: "smooth", block: "center" });
            // eslint-disable-next-line no-async-promise-executor
            (async () => {
              await randomDelay(400, 1200);
              btn.click();
              anyClicked = true;
              console.log('🔁 Clicked load more button:', btn.outerHTML);
              await randomDelay();
            })();
          }
        });
      });
      // Also check for legacy/other see more buttons
      const seeMoreButton = post.querySelector(
        'button[data-view-name="more-comments"], button.comments-comments-list__load-more-comments-button, .comments-comments-list__load-more-comments-arrows button'
      );
      if (seeMoreButton instanceof HTMLButtonElement && !seeMoreButton.disabled) {
        seeMoreButton.scrollIntoView({ behavior: "smooth", block: "center" });
        await randomDelay(400, 1200);
        seeMoreButton.click();
        anyClicked = true;
        console.log('🔁 Clicked legacy see more button:', seeMoreButton.outerHTML);
        await randomDelay();
      }
      if (!anyClicked) break;
      await randomDelay(1000, 2000);
    }
    // Step 3: Expand replies (sub-comments) with random delays
    const comments = Array.from(post.querySelectorAll(".comments-comment-item"));
    for (const comment of comments) {
      while (true) {
        const moreRepliesButton = comment.querySelector<HTMLElement>(
          ".comments-replies-list__replies-button, button[data-view-name='show-more-replies']"
        );
        if (!moreRepliesButton) break;
        console.log("🔁 Expanding replies...");
        moreRepliesButton.scrollIntoView({ behavior: "smooth", block: "center" });
        await randomDelay(400, 1200);
        const clickedReply = await attemptClick(moreRepliesButton, 3, post);
        console.log("✅ Clicked reply:", clickedReply);
        await randomDelay(1200, 2200);
      }
    }
    console.log("🎉 All comments and replies loaded successfully!");
  } catch (error) {
    console.error("❌ Error while loading comments:", error);
    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForElement(
  scope: HTMLElement | Document,
  selector: string,
  timeout = 3000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = scope.querySelector(selector);
    if (element) return resolve(element);

    const observer = new MutationObserver(() => {
      const found = scope.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(scope, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}


async function isElementClickable(element: HTMLElement): Promise<boolean> {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  const isInViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  return isVisible && isInViewport;
}

async function attemptClick( element: HTMLElement, retries = 3, post?: HTMLElement): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    // try {
      element.click();
      await delay(1000);

      // Check if new comments are loading
      const newCommentsLoaded = post?.querySelector('.comments-comment-entity');
      if (newCommentsLoaded) {
        return true;
      }
 
  }
  return false;
}

