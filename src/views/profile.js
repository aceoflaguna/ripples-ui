import { api } from '../api.js';
import { escapeHtml, timeAgo } from '../utils.js';
import { renderPostRow } from '../components/postRow.js';
import { wireVotes } from '../components/voteControl.js';

export async function renderProfileView(outlet, ctx) {
  const { username } = ctx.params;
  outlet.innerHTML = `<div class="empty-state"><p>Loading profile&hellip;</p></div>`;

  let profile;
  let stats = null;
  try {
    const res = await api.getUser(username);
    profile = res?.data;
    try {
      stats = (await api.getUserStats(username))?.data;
    } catch {
      /* stats optional */
    }
  } catch {
    outlet.innerHTML = `<div class="alert alert-danger">User not found.</div>`;
    return;
  }

  outlet.innerHTML = `
    <div class="profile-header">
      <h1 class="view-title">${escapeHtml(profile.username)}</h1>
      ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : ''}
      ${
        stats
          ? `<div class="profile-stats">
              <span><strong>${stats.post_count ?? 0}</strong> posts</span>
              <span><strong>${stats.comment_count ?? 0}</strong> comments</span>
              <span><strong>${stats.karma ?? stats.totalKarma ?? 0}</strong> karma</span>
              <span><strong>${stats.community_count ?? 0}</strong> communities </span>
            </div>`
          : ''
      }
      ${profile.created_at || profile.createdAt ? `<p class="text-muted small">Joined ${timeAgo(profile.created_at || profile.createdAt)}</p>` : ''}
    </div>
    <div class="tab-strip">
      <button class="tab-link active" data-tab="posts">Posts</button>
      <button class="tab-link" data-tab="comments">Comments</button>
    </div>
    <div id="profile-content" class="post-list">
      <p class="text-muted">Loading&hellip;</p>
    </div>
  `;

  const content = outlet.querySelector('#profile-content');
  const tabs = outlet.querySelectorAll('.tab-link');

  async function loadTab(tab) {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    content.innerHTML = '<p class="text-muted">Loading&hellip;</p>';
    try {
      if (tab === 'posts') {
        const res = await api.getUserPosts(username, { limit: 25 });
        const posts = res?.data?.items || res?.data || [];
        content.innerHTML = posts.length ? posts.map(renderPostRow).join('') : '<p class="text-muted">No posts yet.</p>';
        wireVotes(content);
      } else {
        const res = await api.getUserComments(username, { limit: 25 });
        const comments = res?.data?.items || res?.data || [];
        content.innerHTML = comments.length
          ? comments
              .map(
                (c) => `<div class="comment-card">
                  <p class="post-row-meta">on <a href="#/post/${c.postId || c.post_id}">${escapeHtml(c.postTitle || 'a post')}</a>, ${timeAgo(c.created_at || c.createdAt)}</p>
                  <p class="comment-text">${escapeHtml(c.content)}</p>
                </div>`
              )
              .join('')
          : '<p class="text-muted">No comments yet.</p>';
      }
    } catch (err) {
      content.innerHTML = `<div class="alert alert-danger">${err.message || 'Could not load this.'}</div>`;
    }
  }

  tabs.forEach((t) => t.addEventListener('click', () => loadTab(t.dataset.tab)));
  loadTab('posts');
}
