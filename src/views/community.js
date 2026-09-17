import { api, isLoggedIn } from '../api.js';
import { escapeHtml } from '../utils.js';
import { toast } from '../utils.js';
import { renderPostRow } from '../components/postRow.js';
import { wireVotes } from '../components/voteControl.js';

export async function renderCommunityView(outlet, ctx) {
  const { name } = ctx.params;
  outlet.innerHTML = `<div class="empty-state"><p>Loading community&hellip;</p></div>`;

  let community;
  try {
    const res = await api.getCommunityByName(name);
    community = res?.data;
  } catch (err) {
    outlet.innerHTML = `<div class="alert alert-danger">Community not found.</div>`;
    return;
  }

  outlet.innerHTML = `
    <div class="community-header">
      <h1 class="view-title">${escapeHtml(community.name)}</h1>
      <p class="community-description">${escapeHtml(community.description || '')}</p>
      <div class="d-flex gap-2">
        ${isLoggedIn() ? `<button id="join-btn" class="btn btn-sm btn-outline-accent">Join</button>` : ''}
        <a href="#/submit?community=${encodeURIComponent(community.name)}&community_id=${encodeURIComponent(community.id)}" class="btn btn-sm btn-accent">Post here</a>
      </div>
    </div>
    <div id="community-posts" class="post-list">
      <p class="text-muted">Loading posts&hellip;</p>
    </div>
  `;

  outlet.querySelector('#join-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const joining = btn.textContent.trim() === 'Join';
    btn.disabled = true;
    try {
      if (joining) {
        await api.joinCommunity(community.id);
        btn.textContent = 'Leave';
        btn.classList.replace('btn-outline-accent', 'btn-ghost');
        toast(`Joined ${community.name}.`);
      } else {
        await api.leaveCommunity(community.id);
        btn.textContent = 'Join';
        btn.classList.replace('btn-ghost', 'btn-outline-accent');
        toast(`Left ${community.name}.`);
      }
    } catch (err) {
      toast(err.message || 'Could not update membership.', 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  const list = outlet.querySelector('#community-posts');
  try {
    const res = await api.getCommunityPosts(community.id, { sortBy: 'hot', limit: 25 });
    const posts = res?.data?.posts || res?.data || [];
    list.innerHTML = posts.length
      ? posts.map(renderPostRow).join('')
      : `<div class="empty-state"><p>No posts in this community yet. <a href="#/submit?community=${encodeURIComponent(community.name)}">Start one</a>.</p></div>`;
    wireVotes(list);
  } catch (err) {
    list.innerHTML = `<div class="alert alert-danger">${err.message || 'Could not load posts.'}</div>`;
  }
}
