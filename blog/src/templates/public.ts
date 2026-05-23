import { baseHead } from './styles';
import { diagramStyles, diagramScripts, diagramInitScript } from './diagrams';

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  published?: number;
  created_at: string;
  updated_at?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readingTime(content: string | undefined): string {
  if (!content) return '';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}

// Small static status pill — same shape as the main site's chip, no JS.
function chip(label = 'log'): string {
  return `
    <div class="chip" aria-label="status">
      <span class="chip-dot" aria-hidden></span>
      <span class="chip-label">tx</span>
      <span class="chip-sep">·</span>
      <span class="chip-channel">ro_dawoof / ${label}</span>
    </div>
  `;
}

function corners(): string {
  return `<span class="br-tl" aria-hidden></span><span class="br-tr" aria-hidden></span><span class="br-bl" aria-hidden></span><span class="br-br" aria-hidden></span>`;
}

// =========================================================
// HOME — entry index
// =========================================================
export function renderHome(posts: Post[]): string {
  const total = posts.length;

  const entries = total > 0
    ? posts.map((post, i) => {
        const num = String(total - i).padStart(2, '0');
        const totalPad = String(total).padStart(2, '0');
        return `
          <a class="entry" href="/p/${escapeAttr(post.slug)}">
            <span class="entry-num">log_${num}<em>/</em>${totalPad}</span>
            <span class="entry-titles">
              <span class="entry-title">${post.title}</span>
              ${post.excerpt ? `<span class="entry-excerpt">${post.excerpt}</span>` : ''}
            </span>
            <span class="entry-date">${formatDate(post.created_at)}</span>
          </a>
        `;
      }).join('')
    : `
        <div class="empty">
          <span class="meta meta-accent">empty channel</span>
          <p>no entries published yet</p>
        </div>
      `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${baseHead}
  <title>ro_dawoof / log</title>
  <meta name="description" content="field notes &amp; teardowns by frgmt0">
  <style>
    .hero {
      padding: 5.5rem 0 2.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .hero .meta { margin-bottom: 0.6rem; }
    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 600;
      letter-spacing: -0.035em;
      line-height: 0.95;
      color: var(--fg);
    }
    .hero h1 .accent { color: var(--accent); }
    .hero .deck {
      font-family: var(--italic);
      font-style: italic;
      color: var(--fg-dim);
      font-size: 1.15rem;
      line-height: 1.4;
      max-width: 40ch;
    }

    .index-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0 0 0.85rem;
      border-bottom: 1px solid var(--line);
      margin-top: 1.75rem;
    }

    .entries { display: flex; flex-direction: column; }

    .entry {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1.5rem;
      align-items: baseline;
      padding: 1.1rem 0;
      border-bottom: 1px solid var(--line);
      text-decoration: none;
      color: var(--fg-prose);
      transition: color 160ms ease;
    }
    .entry:hover { color: var(--fg); }
    .entry:hover .entry-title { color: var(--accent); }
    .entry:hover .entry-num { color: var(--fg); }

    .entry-num {
      font-family: var(--mono);
      font-size: 10.5px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--fg-dim);
      font-variant-numeric: tabular-nums;
      align-self: start;
      padding-top: 0.4em;
      transition: color 160ms ease;
    }
    .entry-num em { color: var(--fg-low); font-style: normal; padding: 0 0.25em; }

    .entry-titles { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .entry-title {
      font-family: var(--display);
      font-weight: 600;
      font-size: clamp(1.15rem, 2.2vw, 1.45rem);
      letter-spacing: -0.018em;
      line-height: 1.15;
      color: var(--fg);
      transition: color 160ms ease;
    }
    .entry-excerpt {
      font-family: var(--serif);
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--fg-dim);
      max-width: 56ch;
    }

    .entry-date {
      font-family: var(--mono);
      font-size: 10.5px;
      letter-spacing: 0.18em;
      color: var(--fg-dim);
      font-variant-numeric: tabular-nums;
      align-self: start;
      padding-top: 0.5em;
      white-space: nowrap;
    }

    .empty {
      padding: 5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .empty p {
      font-family: var(--display);
      color: var(--fg-dim);
      font-size: 1.1rem;
    }

    .foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3rem 0 2rem;
      border-top: 1px solid var(--line);
      margin-top: 2rem;
    }
    .foot a, .foot span {
      font-family: var(--mono);
      font-size: 10.5px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-dim);
    }
    .foot a { transition: color 160ms ease; }
    .foot a:hover { color: var(--accent); }

    @media (max-width: 640px) {
      .entry { grid-template-columns: 1fr auto; gap: 0.75rem 1rem; }
      .entry-num { grid-column: 1 / -1; padding-top: 0; }
      .entry-date { padding-top: 0; }
    }
  </style>
</head>
<body>
  ${chip()}

  <div class="container">
    <header class="hero">
      <div class="meta">ro_dawoof<span class="meta-sep">·</span>log<span class="meta-sep">·</span>ch.07</div>
      <h1>field <span class="accent">notes</span></h1>
      <p class="deck">teardowns, postmortems, and things-that-broke from frgmt0.</p>
    </header>

    <div class="index-head">
      <span class="meta">entries · ${String(total).padStart(2, '0')}</span>
      <span class="meta meta-accent">most recent first</span>
    </div>

    <main class="entries">
      ${entries}
    </main>

    <footer class="foot">
      <a href="https://kcodes.me">← kcodes.me</a>
      <span>frgmt0 · ${new Date().getUTCFullYear()}</span>
    </footer>
  </div>
</body>
</html>`;
}

// =========================================================
// POST — single entry
// =========================================================
export function renderPost(post: Post, htmlContent: string): string {
  const rt = readingTime(post.content);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${baseHead}
  <title>${post.title} — ro_dawoof / log</title>
  <meta name="description" content="${escapeAttr(post.excerpt || post.title)}">
  ${diagramScripts}
  <style>${diagramStyles}</style>
  <style>
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.4rem 0;
    }
    .topbar a {
      font-family: var(--mono);
      font-size: 10.5px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--fg-dim);
      transition: color 160ms ease;
    }
    .topbar a:hover { color: var(--accent); }

    .post-head {
      padding: 2rem 0 2.5rem;
      border-bottom: 1px solid var(--line);
      margin-bottom: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .post-head h1 {
      font-family: var(--display);
      font-size: clamp(1.85rem, 4.2vw, 2.9rem);
      font-weight: 600;
      letter-spacing: -0.028em;
      line-height: 1.05;
      color: var(--fg);
    }
    .post-head .deck {
      font-family: var(--italic);
      font-style: italic;
      color: var(--fg-dim);
      font-size: 1.2rem;
      line-height: 1.45;
      max-width: 52ch;
    }

    article { padding-bottom: 3rem; }

    .post-foot {
      padding: 2.5rem 0 1.5rem;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .post-foot .meta { color: var(--fg-low); }
  </style>
</head>
<body>
  ${chip()}

  <div class="container container--prose">
    <nav class="topbar">
      <a href="/">← log</a>
      <a href="https://kcodes.me">kcodes.me →</a>
    </nav>

    <article>
      <header class="post-head">
        <div class="meta">
          <span>${formatDate(post.created_at)}</span>
          ${rt ? `<span class="meta-sep">·</span><span>${rt}</span>` : ''}
          <span class="meta-sep">·</span>
          <span class="meta-accent">log</span>
        </div>
        <h1>${post.title}</h1>
        ${post.excerpt ? `<p class="deck">${post.excerpt}</p>` : ''}
      </header>

      <div class="post-content prose">
        ${htmlContent}
      </div>
    </article>

    <footer class="post-foot">
      <a href="/" class="btn btn-ghost">← more entries</a>
      <span class="meta">frgmt0</span>
    </footer>
  </div>
  ${diagramInitScript}
</body>
</html>`;
}

// =========================================================
// 404
// =========================================================
export function render404(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${baseHead}
  <title>signal lost — ro_dawoof / log</title>
  <style>
    .panel {
      min-height: 80dvh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 1rem;
      max-width: 42ch;
    }
    .panel .meta-err { color: var(--err); }
    .panel h1 {
      font-family: var(--display);
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--fg);
    }
    .panel p {
      font-family: var(--italic);
      font-style: italic;
      color: var(--fg-dim);
      font-size: 1.15rem;
      line-height: 1.4;
    }
    .panel .actions { margin-top: 1rem; display: flex; gap: 0.75rem; }
  </style>
</head>
<body>
  ${chip()}

  <div class="container container--prose">
    <div class="panel">
      <div class="meta"><span class="meta-err">err</span><span class="meta-sep">·</span><span>404</span></div>
      <h1>signal lost</h1>
      <p>no entry at this address. it may have been pulled, renamed, or never broadcast.</p>
      <div class="actions">
        <a href="/" class="btn btn-primary">back to log</a>
        <a href="https://kcodes.me" class="btn btn-ghost">kcodes.me</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderNotFound(): string {
  return render404();
}
