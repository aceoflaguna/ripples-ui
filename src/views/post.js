import { api, getCurrentUser, isLoggedIn } from '../api.js';
import { escapeHtml, timeAgo, toast, requireAuth } from '../utils.js';
import { renderVote, wireVotes } from '../components/voteControl.js';
import { renderCommentThread, wireCommentThread } from '../components/commentThread.js';

export async function renderPostView(outlet, ctx) {
  const { id } = ctx.params;
  outlet.innerHTML = `<div class="empty-state"><p>Loading post&hellip;</p></div>`;

  let post;
  try {
    const res = await api.getPost(id);
    post = res?.data;
  } catch (err) {
    outlet.innerHTML = `<div class="alert alert-danger">This post couldn\u2019t be found.</div>`;
    return;
  }

  const community = post.community?.name || post.communityName || '';
  const author = post.author_username || 'unknown';
  const currentUser = getCurrentUser();
  const isOwner = currentUser && currentUser.username === author;
  const isLink = post.type === 'link' && post.url;

  outlet.innerHTML = `
    <article class="post-detail">
      <div class="post-detail-row">
        ${renderVote({ postId: post.id }, post.score ?? post.voteScore ?? 0, post.userVote ?? 0)}
        <div class="flex-grow-1">
          <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
          <p class="post-row-meta">
            in <a href="#/c/${escapeHtml(community)}">${escapeHtml(community)}</a>
            &nbsp;by <a href="#/u/${escapeHtml(author)}">${escapeHtml(author)}</a>, ${timeAgo(post.created_at || post.createdAt)}
          </p>
          ${isLink ? `<a href="${escapeHtml(post.url)}" target="_blank" rel="noopener" class="post-detail-link">${escapeHtml(post.url)}</a>` : ''}
          ${post.content ? `<div class="post-detail-content">${escapeHtml(post.content)}</div>` : ''}
          ${
            isOwner
              ? `<div class="d-flex gap-2 mt-2">
                  <button class="btn btn-sm btn-ghost" id="delete-post-btn">Delete</button>
                </div>`
              : ''
          }
        </div>
      </div>
    </article>

    <section class="comment-section">
      <h2 class="comment-section-title">Comments</h2>
      ${
        isLoggedIn()
          ? `<form id="new-comment-form" class="mb-4">
              <textarea class="form-control" rows="3" placeholder="What are your thoughts?" required></textarea>
              <button type="submit" class="btn btn-accent mt-2">Comment</button>
            </form>`
          : `<p class="text-muted"><a href="#/login">Log in</a> to join the discussion.</p>`
      }
      <div id="comments-container">
        <p class="text-muted">Loading comments&hellip;</p>
      </div>
    </section>
  `;

  wireVotes(outlet);

  outlet.querySelector('#delete-post-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete this post? This can\u2019t be undone.')) return;
    try {
      await api.deletePost(post.id);
      toast('Post deleted.');
      window.location.hash = '/';
    } catch (err) {
      toast(err.message || 'Could not delete the post.', 'danger');
    }
  });

  outlet.querySelector('#new-comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    const textarea = e.target.querySelector('textarea');
    const content = textarea.value.trim();
    if (!content) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api.createComment({ postId: post.id, content });
      textarea.value = '';
      toast('Comment posted.');
      await loadComments();
    } catch (err) {
      toast(err.message || 'Could not post your comment.', 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  async function loadComments() {
    const container = outlet.querySelector('#comments-container');
    try {
      const res = await api.getPostComments(post.id, { sortBy: 'best', limit: 50 });
      const comments = res?.data?.items || res?.data || [];
      container.innerHTML = await renderCommentThread(comments);
      wireCommentThread(container, post.id, loadComments);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger">${err.message || 'Could not load comments.'}</div>`;
    }
  }

  loadComments();
}
