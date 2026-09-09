import { api, isLoggedIn } from '../api.js';
import { escapeHtml, toast, requireAuth } from '../utils.js';

export async function renderCommunitiesView(outlet) {
  outlet.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Communities</h1>
    </div>
    ${
      isLoggedIn()
        ? `<form id="create-community-form" class="create-community-form">
            <div class="row g-2">
              <div class="col-md-4">
                <input type="text" class="form-control" id="community-name" placeholder="Community name" required minlength="3" />
              </div>
              <div class="col-md-6">
                <input type="text" class="form-control" id="community-desc" placeholder="What's it about?" />
              </div>
              <div class="col-md-2">
                <button type="submit" class="btn btn-accent w-100">Create</button>
              </div>
            </div>
          </form>`
        : `<p class="text-muted"><a href="#/login">Log in</a> to create a community.</p>`
    }
    <ul id="community-list" class="community-list">
      <li class="text-muted">Loading&hellip;</li>
    </ul>
  `;

  outlet.querySelector('#create-community-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    const name = outlet.querySelector('#community-name').value.trim();
    const description = outlet.querySelector('#community-desc').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api.createCommunity({ name, description });
      toast(`Created ${name}.`);
      window.location.hash = `/c/${encodeURIComponent(name)}`;
    } catch (err) {
      toast(err.message || 'Could not create the community.', 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  const list = outlet.querySelector('#community-list');
  try {
    const res = await api.getCommunities({ limit: 50, offset: 0 });
    const communities = res?.data?.items || res?.data || [];
    list.innerHTML = communities.length
      ? communities
          .map(
            (c) => `<li class="community-list-item">
              <a href="#/c/${escapeHtml(c.name)}" class="community-list-name">${escapeHtml(c.name)}</a>
              <p class="community-list-desc">${escapeHtml(c.description || '')}</p>
            </li>`
          )
          .join('')
      : '<li class="text-muted">No communities yet.</li>';
  } catch (err) {
    list.innerHTML = `<li class="text-danger">${err.message || 'Could not load communities.'}</li>`;
  }
}
