import { mountReactionButton } from './mountReactionButton';
import { mountCommentButton } from './mountCommentButton';
import { mountRepostButton } from './mountRepostButton';

/**
 * Inject buttons into a LinkedIn post (before social footer).
 */
export function injectButtonsForPost(post: HTMLElement) {
   if (!post) return;

  if (post.querySelector('.scrape-buttons-container')) return;

  const target =
  post.querySelector(
    '.social-details-social-counts, div:has([data-view-name="feed-comment-count"]), div:has([data-view-name="feed-reaction-count"]), div:has([data-view-name="feed-repost-count"])'
  ) ||
  (() => {
    const el = post.querySelector(
      '[data-view-name="feed-comment-count"], [data-view-name="feed-reaction-count"], [data-view-name="feed-repost-count"]'
    );
    return el ? el.closest('div') : null;
  })();

  if (!target) return;

  const container = document.createElement('div');
  container.className = 'scrape-buttons-container';
  Object.assign(container.style, {
    marginTop: '8px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  });

  // --- Reactions button ---
  const reactionContainer = document.createElement('div');
  reactionContainer.style.display = 'flex';
  reactionContainer.style.alignItems = 'center';
  reactionContainer.style.gap = '6px';
  mountReactionButton(reactionContainer, post);
  container.appendChild(reactionContainer);

  // --- Comments button ---
  const commentContainer = document.createElement('div');
  commentContainer.style.display = 'flex';
  commentContainer.style.alignItems = 'center';
  commentContainer.style.gap = '6px';
  mountCommentButton(commentContainer, post);
  container.appendChild(commentContainer);

  // --- Reposts button ---
  const repostContainer = document.createElement('div');
  repostContainer.style.display = 'flex';
  repostContainer.style.alignItems = 'center';
  repostContainer.style.gap = '6px';
  mountRepostButton(repostContainer, post);
  container.appendChild(repostContainer);

  // Insert container before the target element
  if (target.parentNode) target.parentNode.insertBefore(container, target.nextSibling);
  else post.appendChild(container);
}
