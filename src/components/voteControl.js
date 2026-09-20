import { api } from '../api.js';
import { toast, requireAuth } from '../utils.js';

/**
 * Renders a vertical vote numeral and wires up click handlers.
 * target: { postId } or { commentId }
 */
export function renderVote(target, score, userVote = 0) {
  const key = target.postId ? `post-${target.postId}` : `comment-${target.commentId}`;
  return `
    <div class="vote-stack" data-vote-key="${key}">
      <button class="vote-btn vote-up ${userVote === 1 ? 'active' : ''}" aria-label="Upvote" data-dir="1">&#9650;</button>
      <div class="vote-score">${score ?? 0}</div>
      <button class="vote-btn vote-down ${userVote === -1 ? 'active' : ''}" aria-label="Downvote" data-dir="-1">&#9660;</button>
    </div>`;
}

export function wireVotes(container) {
  container.querySelectorAll('[data-vote-key]').forEach((stack) => {
    stack.addEventListener('click', async (e) => {
      const btn = e.target.closest('.vote-btn');
      if (!btn) return;
      if (!requireAuth('Log in to vote.')) return;

      const dir = Number(btn.dataset.dir);
      const key = stack.dataset.voteKey;
      const [type, ...rest] = key.split('-');
      const id = rest.join('-');
      const target = type === 'post' ? { postId: id } : { commentId: id };
      const scoreEl = stack.querySelector('.vote-score');
      const upBtn = stack.querySelector('.vote-up');
      const downBtn = stack.querySelector('.vote-down');
      const wasActive = btn.classList.contains('active');
      let delta = 0;

      try {
        if (wasActive) {
          await api.removeVote(target);
          delta = dir === 1 ? -1 : 1;
          btn.classList.remove('active');
        } else {
          const otherActive = dir === 1 ? downBtn.classList.contains('active') : upBtn.classList.contains('active');
          await api.vote({ ...target, voteType: dir });
          delta = otherActive ? dir * 2 : dir;
          upBtn.classList.toggle('active', dir === 1);
          downBtn.classList.toggle('active', dir === -1);
        }
        scoreEl.textContent = String(Number(scoreEl.textContent) + delta);
      } catch (err) {
        toast(err.message || 'Could not register your vote.', 'danger');
      }
    });
  });
}
