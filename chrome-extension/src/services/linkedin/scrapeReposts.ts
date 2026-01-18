import { LeadI } from '../../types';

export async function scrapeReposts(post: Element): Promise<LeadI[]> {
  const profiles: LeadI[] = [];

  const shareEls = post.querySelectorAll('[data-activity-type="SHARE"]');
  shareEls.forEach(el => {
    const name = el.querySelector('.update-components-actor__name')?.textContent?.trim() || '';
    const link = el.querySelector('a[href*="/in/"]')?.getAttribute('href') || '';
    const headline = el.querySelector('.update-components-actor__description')?.textContent?.trim() || '';

    if (name && link) {
      profiles.push({
        name,
        caption: headline,
        profileLink: absoluteUrl(link),
        sourceLink: 'reposts',
        type: 'reposts',
      });
    }
  });

  // addProfiles(profiles);
  console.log('🔁 Shares scraped:', profiles.length);
  return profiles;
}

function absoluteUrl(url: string) {
  return url.startsWith('http') ? url : `https://www.linkedin.com${url}`;
}
