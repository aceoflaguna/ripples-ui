import { api } from '../api.js';
import { renderPostRow } from '../components/postRow.js';
import { wireVotes } from '../components/voteControl.js';

const SORTS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
  { key: 'controversial', label: 'Controversial' }
];

export async function renderFeedView(outlet, ctx = {}) {
  const sortBy = ['hot', 'new', 'top', 'controversial'].includes(ctx.query?.sort) ? ctx.query.sort : 'hot';

  outlet.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Front page</h1>
      <div class="tab-strip" role="tablist">
        ${SORTS.map(
          (s) => `<a href="#/?sort=${s.key}" class="tab-link ${s.key === sortBy ? 'active' : ''}">${s.label}</a>`
        ).join('')}
      </div>
    </div>
    <div id="feed-list" class="post-list" aria-live="polite">
      ${skeletonRows()}
    </div>
  `;
  document.querySelectorAll('.sidebar-link[data-sort]').forEach((l) =>
    l.classList.toggle('active', l.dataset.sort === sortBy)
  );

  const list = outlet.querySelector('#feed-list');
  try {
    const res = await api.getFeed({ sortBy, limit: 25, offset: 0 });
    const posts = res?.data?.items || res?.data || [];
    if (!posts.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h2>It's quiet here</h2>
          <p>No posts yet &mdash; be the first to <a href="#/submit">start a discussion</a>.</p>
        </div>`;
      return;
    }
    list.innerHTML = posts.map(renderPostRow).join('');
    wireVotes(list);
  } catch (err) {
    list.innerHTML = `<div class="alert alert-danger">${err.message || 'Could not load the feed.'}</div>`;
  }
}

function skeletonRows() {
  return Array.from({ length: 5 })
    .map(
      () => `<div class="post-row post-row-skeleton">
        <div class="skeleton-block" style="width:2rem;height:3rem"></div>
        <div class="flex-grow-1">
          <div class="skeleton-block" style="width:60%;height:1.1rem;margin-bottom:.5rem"></div>
          <div class="skeleton-block" style="width:35%;height:.8rem"></div>
        </div>
      </div>`
    )
    .join('');
}
