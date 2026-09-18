import { api, getCurrentUser } from '../api.js';
import { escapeHtml, timeAgo, toast, requireAuth } from '../utils.js';
import { renderVote, wireVotes } from './voteControl.js';


function renderCommentReplies(comment) {
  let author = comment.author_username || 'unknown';

  return `
    <li class="comment" data-comment-id="${comment.id}">
      <div class="comment-row">
        <div class="comment-body">
          <p class="comment-meta">${escapeHtml(author)} &middot; ${timeAgo(comment.created_at || comment.createdAt)}</p>
          <p class="comment-text">${escapeHtml(comment.content)}</p>
        </div>
      </div>
    </li>`;
}

async function renderComment(comment) {
  const author = comment.author_username || comment.username || 'unknown';
  const score = comment.score ?? comment.voteScore ?? 0;
  const userVote = comment.userVote ?? 0;

  let repliesRes = await api.getCommentReplies(comment.id);
  const replies = repliesRes.data || [];
  return `
    <li class="comment" data-comment-id="${comment.id}">
      <div class="comment-row">
        ${renderVote({ commentId: comment.id }, score, userVote)}
        <div class="comment-body">
          <p class="comment-meta">${escapeHtml(author)} &middot; ${timeAgo(comment.created_at || comment.createdAt)}</p>
          <p class="comment-text">${escapeHtml(comment.content)}</p>
          <button class="btn-link-plain reply-toggle" data-comment-id="${comment.id}">Reply</button>
          <form class="reply-form d-none" data-comment-id="${comment.id}">
            <textarea class="form-control form-control-sm" rows="2" placeholder="Write a reply" required></textarea>
            <div class="mt-1 d-flex gap-2">
              <button type="submit" class="btn btn-sm btn-accent">Reply</button>
              <button type="button" class="btn btn-sm btn-ghost cancel-reply">Cancel</button>
            </div>
          </form>
          ${replies.length ? `<ul class="comment-list nested">${replies.map(renderCommentReplies).join('')}</ul>` : ''}
        </div>
      </div>
    </li>`;
}

export async function renderCommentThread(comments) {
  if (!comments.length) {
    return '<p class="text-muted">No comments yet. Start the discussion.</p>';
  }
  const renderedComments = await Promise.all(comments.map(renderComment));
  return `<ul class="comment-list">${renderedComments.join('')}</ul>`;
}


export function wireCommentThread(container, postId, onReplyAdded) {
  wireVotes(container);

  container.querySelectorAll('.reply-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!requireAuth('Log in to reply.')) return;
      const form = container.querySelector(`.reply-form[data-comment-id="${btn.dataset.commentId}"]`);
      form.classList.toggle('d-none');
      if (!form.classList.contains('d-none')) form.querySelector('textarea').focus();
    });
  });

  container.querySelectorAll('.cancel-reply').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.reply-form').classList.add('d-none'));
  });

  container.querySelectorAll('.reply-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = form.querySelector('textarea');
      const content = textarea.value.trim();
      if (!content) return;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        await api.createComment({ postId, parentCommentId: form.dataset.commentId, content });
        toast('Reply posted.');
        textarea.value = '';
        form.classList.add('d-none');
        onReplyAdded?.();
      } catch (err) {
        toast(err.message || 'Could not post your reply.', 'danger');
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
}
