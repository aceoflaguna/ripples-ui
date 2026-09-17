import { api } from '../api.js';
import { escapeHtml } from '../utils.js';

export function renderSidebarShell() {
  return `
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <a href="#/" class="sidebar-link" data-sort="hot">Hot</a>
      <a href="#/?sort=new" class="sidebar-link" data-sort="new">New</a>
      <a href="#/?sort=top" class="sidebar-link" data-sort="top">Top</a>
      <a href="#/?sort=controversial" class="sidebar-link" data-sort="controversial">Controversial</a>
    </nav>
    <div class="sidebar-section">
      <div class="sidebar-heading">Communities</div>
      <ul class="sidebar-communities" id="sidebar-communities">
        <li class="text-muted small px-2">Loading&hellip;</li>
      </ul>
      <a href="#/communities" class="sidebar-link sidebar-link-muted">Browse all</a>
    </div>
  </aside>`;
}

export async function loadSidebarCommunities(root) {
  const list = root.querySelector('#sidebar-communities');
  if (!list) return;
  try {
    const res = await api.getCommunities({ limit: 8, offset: 0 });
    const communities = res?.data?.items || res?.data || [];
    if (!communities.length) {
      list.innerHTML = '<li class="text-muted small px-2">No communities yet.</li>';
      return;
    }
    list.innerHTML = communities
      .map(
        (c) => `<li><a href="#/c/${escapeHtml(c.id)}" class="sidebar-link">${escapeHtml(c.name)}</a></li>`
      )
      .join('');
  } catch {
    list.innerHTML = '<li class="text-muted small px-2">Communities unavailable.</li>';
  }
}
