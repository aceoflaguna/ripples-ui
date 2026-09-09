const routes = [];
let notFoundHandler = () => '<p>Page not found.</p>';
let outlet = null;

export function registerRoute(path, handler) {
  const paramNames = [];
  const pattern = path
    .replace(/:[a-zA-Z]+/g, (m) => {
      paramNames.push(m.slice(1));
      return '([^/]+)';
    })
    .replace(/\//g, '\\/');
  routes.push({ regex: new RegExp(`^${pattern}$`), paramNames, handler });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

function parseHash() {
  const raw = window.location.hash.slice(1) || '/';
  const [path, queryString = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { path: path || '/', query };
}

async function render() {
  if (!outlet) return;
  const { path, query } = parseHash();
  window.scrollTo(0, 0);

  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      outlet.setAttribute('aria-busy', 'true');
      try {
        await route.handler({ params, query });
      } catch (err) {
        console.error(err);
        outlet.innerHTML = `<div class="alert alert-danger m-3">Something went wrong loading this page.</div>`;
      }
      outlet.removeAttribute('aria-busy');
      return;
    }
  }
  outlet.innerHTML = await notFoundHandler();
}

export function startRouter(outletEl) {
  outlet = outletEl;
  window.addEventListener('hashchange', render);
  render();
}
