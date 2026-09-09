import { api } from '../api.js';
import { escapeHtml } from '../utils.js';
import { renderPostRow } from '../components/postRow.js';
import { wireVotes } from '../components/voteControl.js';

export async function renderSearchView(outlet, ctx) {
  const q = ctx.query?.q || '';
  outlet.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Search results for &ldquo;${escapeHtml(q)}&rdquo;</h1>
    </div>
    <h2 class="section-subhead">Communities</h2>
    <ul id="search-communities" class="community-list"><li class="text-muted">Loading&hellip;</li></ul>
    <h2 class="section-subhead">Posts</h2>
    <div id="search-posts" class="post-list"><p class="text-muted">Loading&hellip;</p></div>
  `;

  if (!q) {
    outlet.querySelector('#search-communities').innerHTML = '<li class="text-muted">Type something to search for.</li>';
    outlet.querySelector('#search-posts').innerHTML = '';
    return;
  }

  const communitiesList = outlet.querySelector('#search-communities');
  try {
    const res = await api.searchCommunities(q, { limit: 10 });
    const communities = res?.data?.items || res?.data || [];
    communitiesList.innerHTML = communities.length
      ? communities
          .map(
            (c) => `<li class="community-list-item">
              <a href="#/c/${escapeHtml(c.name)}" class="community-list-name">${escapeHtml(c.name)}</a>
              <p class="community-list-desc">${escapeHtml(c.description || '')}</p>
            </li>`
          )
          .join('')
      : '<li class="text-muted">No matching communities.</li>';
  } catch (err) {
    communitiesList.innerHTML = `<li class="text-danger">${err.message || 'Search failed.'}</li>`;
  }

  const postsList = outlet.querySelector('#search-posts');
  try {
    const res = await api.searchPosts(q, { limit: 20 });
    const posts = res?.data?.items || res?.data || [];
    postsList.innerHTML = posts.length ? posts.map(renderPostRow).join('') : '<p class="text-muted">No matching posts.</p>';
    wireVotes(postsList);
  } catch (err) {
    postsList.innerHTML = `<div class="alert alert-danger">${err.message || 'Search failed.'}</div>`;
  }
}
