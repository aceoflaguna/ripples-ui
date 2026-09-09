import { escapeHtml, timeAgo } from '../utils.js';
import { renderVote } from './voteControl.js';

export function renderPostRow(post) {
  const community = post.community?.name || post.communityName || post.community_id || '';
  const author = post.author?.username || post.username || 'unknown';
  const commentCount = post.commentCount ?? post.comment_count ?? 0;
  const score = post.score ?? post.voteScore ?? 0;
  const userVote = post.userVote ?? 0;
  const title = escapeHtml(post.title || '');
  const isLink = post.type === 'link' && post.url;
  let linkHost = '';
  if (isLink) {
    try {
      linkHost = new URL(post.url).hostname.replace('www.', '');
    } catch {
      linkHost = post.url;
    }
  }

  return `
    <article class="post-row" data-post-id="${post.id}">
      ${renderVote({ postId: post.id }, score, userVote)}
      <div class="post-row-body">
        <h2 class="post-row-title">
          <a href="#/post/${post.id}">${title}</a>
          ${isLink ? `<a class="post-row-link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">(${escapeHtml(linkHost)})</a>` : ''}
        </h2>
        <p class="post-row-meta">
          in <a href="#/c/${escapeHtml(community)}">${escapeHtml(community)}</a>
          &nbsp;by ${escapeHtml(author)}, ${timeAgo(post.created_at || post.createdAt)}
        </p>
        <a class="post-row-comments" href="#/post/${post.id}">${commentCount} comment${commentCount === 1 ? '' : 's'}</a>
      </div>
    </article>`;
}
