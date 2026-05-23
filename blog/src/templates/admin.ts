import { baseHead } from './styles';
import { diagramStyles, diagramScripts, diagramInitScript } from './diagrams';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: number;
  created_at: string;
  updated_at: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Admin kit — behind Cloudflare Access; uses the same tokens as the public
// pages so a palette tweak ripples here automatically.
const adminStyles = `
  .admin-shell {
    max-width: 920px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 1.25rem 0 1.1rem;
    border-bottom: 1px solid var(--line);
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .admin-header h1 {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--fg-dim);
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }
  .admin-header h1 .accent { color: var(--accent); }

  .posts-list {
    display: flex;
    flex-direction: column;
  }

  .post-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1.25rem;
    align-items: baseline;
    padding: 1rem 0;
    border-bottom: 1px solid var(--line);
    transition: background 160ms ease;
  }
  .post-item:hover { background: rgba(241, 236, 224, 0.02); }

  .post-info { min-width: 0; }
  .post-info h3 {
    font-family: var(--display);
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -0.018em;
    margin-bottom: 0.35rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .post-info h3 a { color: var(--fg); transition: color 160ms ease; }
  .post-info h3 a:hover { color: var(--accent); }

  .post-meta {
    display: flex;
    gap: 0.85rem;
    align-items: center;
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--fg-dim);
  }
  .post-meta .slug { color: var(--fg-dim); }
  .post-meta .status {
    padding: 0.15rem 0.5rem;
    border: 1px solid currentColor;
    font-size: 9px;
    letter-spacing: 0.22em;
  }
  .post-meta .status.published { color: var(--ok); }
  .post-meta .status.draft     { color: var(--fg-dim); }

  .post-num {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-dim);
    font-variant-numeric: tabular-nums;
    align-self: start;
    padding-top: 0.6em;
  }

  .post-actions {
    display: flex;
    gap: 0.5rem;
    align-self: start;
    padding-top: 0.3em;
  }
  .post-actions .btn { padding: 0.4rem 0.8rem; font-size: 10px; }

  .empty-state {
    padding: 4rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .empty-state p { color: var(--fg-dim); font-family: var(--display); font-size: 1.1rem; }

  /* =========================================================
     EDITOR — full-screen split view
     ========================================================= */
  .editor-container {
    padding: 0;
    max-width: none;
    height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1.5rem;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
    gap: 1rem;
  }
  .editor-header h1 {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--fg);
  }

  .editor-back {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-dim);
    transition: color 160ms ease;
  }
  .editor-back:hover { color: var(--accent); }

  .editor-actions {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  .editor-meta {
    display: flex;
    gap: 1rem;
    padding: 0.9rem 1.5rem;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
    align-items: end;
  }
  .form-group { margin-bottom: 0; flex: 1; }
  .form-group.slug-group    { max-width: 280px; }
  .form-group.excerpt-group { flex: 2; }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.3rem;
  }
  .checkbox-group input[type="checkbox"] {
    width: auto;
    accent-color: var(--accent);
  }
  .checkbox-group label {
    margin: 0;
    color: var(--fg);
    cursor: pointer;
  }

  .editor-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .editor-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .editor-pane:first-child { border-right: 1px solid var(--line); }

  .editor-pane h3 {
    font-family: var(--mono);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.22em;
    color: var(--fg-dim);
    padding: 0.6rem 1.25rem;
    text-transform: uppercase;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }

  .editor-pane textarea {
    flex: 1;
    min-height: 0;
    resize: none;
    border: none;
    padding: 1.25rem 1.5rem;
    font-family: var(--mono);
    font-size: 13.5px;
    line-height: 1.65;
    background: var(--bg);
    color: var(--fg-prose);
    tab-size: 2;
  }

  .preview-pane {
    background: var(--bg);
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
  .preview-pane.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fg-low);
    font-family: var(--italic);
    font-style: italic;
    font-size: 0.95rem;
  }

  .md-toolbar {
    display: flex;
    gap: 2px;
    padding: 0.35rem 1.25rem;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .md-toolbar button {
    background: none;
    border: 1px solid transparent;
    color: var(--fg-dim);
    padding: 0.3rem 0.5rem;
    font-size: 11px;
    font-family: var(--mono);
    cursor: pointer;
    transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
    letter-spacing: 0.05em;
  }
  .md-toolbar button:hover {
    color: var(--fg);
    border-color: var(--line-2);
    background: var(--bg-2);
  }
  .md-toolbar .sep {
    width: 1px;
    background: var(--line);
    margin: 0.2rem 0.4rem;
  }

  .editor-status {
    display: flex;
    justify-content: space-between;
    padding: 0.45rem 1.5rem;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    color: var(--fg-dim);
    border-top: 1px solid var(--line);
    flex-shrink: 0;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 768px) {
    .editor-main { grid-template-columns: 1fr; }
    .editor-pane:first-child { border-right: none; border-bottom: 1px solid var(--line); }
    .editor-meta { flex-direction: column; gap: 0.75rem; }
    .form-group.slug-group { max-width: none; }
  }
`;

export function renderAdmin(posts: Post[]): string {
  const total = posts.length;
  const postsList = posts.length > 0
    ? posts.map((post, i) => `
        <div class="post-item">
          <span class="post-num">${String(total - i).padStart(2, '0')}/${String(total).padStart(2, '0')}</span>
          <div class="post-info">
            <h3><a href="/e/${post.id}">${escapeHtml(post.title)}</a></h3>
            <div class="post-meta">
              <span class="slug">/p/${escapeHtml(post.slug)}</span>
              <span>${formatDate(post.created_at)}</span>
              <span class="status ${post.published ? 'published' : 'draft'}">${post.published ? 'live' : 'draft'}</span>
            </div>
          </div>
          <div class="post-actions">
            <a href="/e/${post.id}" class="btn btn-ghost">edit</a>
            ${post.published ? `<a href="/p/${escapeHtml(post.slug)}" class="btn btn-ghost" target="_blank">view</a>` : ''}
          </div>
        </div>
      `).join('')
    : `
        <div class="empty-state">
          <span class="meta meta-accent">no entries</span>
          <p>nothing written yet</p>
          <a href="/admin/new" class="btn btn-primary">new entry</a>
        </div>
      `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${baseHead}
  <title>admin — ro_dawoof / log</title>
  <style>${adminStyles}</style>
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>ro_dawoof <span class="accent">/</span> admin</h1>
      <a href="/admin/new" class="btn btn-primary">new entry</a>
    </header>

    <main class="posts-list">
      ${postsList}
    </main>
  </div>
</body>
</html>`;
}

export function renderNewPost(): string {
  return renderEditorPage({
    id: '',
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    published: 0,
    created_at: '',
    updated_at: ''
  }, true);
}

export function renderEditor(post: Post): string {
  return renderEditorPage(post, false);
}

function renderEditorPage(post: Post, isNew: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${baseHead}
  <title>${isNew ? 'new entry' : `edit: ${post.title}`} — ro_dawoof / log</title>
  <style>${adminStyles}</style>
  <style>${diagramStyles}</style>
  ${diagramScripts}
</head>
<body style="overflow: hidden;">
  <div class="editor-container">
    <header class="editor-header">
      <div style="display: flex; align-items: center; gap: 1.5rem;">
        <a href="/admin" class="editor-back">← back</a>
        <h1>${isNew ? 'new entry' : 'edit'}</h1>
      </div>
      <div class="editor-actions">
        ${!isNew ? `<button type="button" class="btn btn-danger" onclick="deletePost()">delete</button>` : ''}
        <div class="checkbox-group">
          <input type="checkbox" id="published" name="published" ${post.published ? 'checked' : ''}>
          <label for="published">publish</label>
        </div>
        <button type="button" class="btn btn-primary" onclick="savePost()">save</button>
      </div>
    </header>

    <form id="post-form" style="display: contents;">
      <div class="editor-meta">
        <div class="form-group">
          <label for="title">title</label>
          <input type="text" id="title" name="title" value="${escapeHtml(post.title)}" placeholder="entry title" required>
        </div>
        <div class="form-group slug-group">
          <label for="slug">slug</label>
          <input type="text" id="slug" name="slug" value="${escapeHtml(post.slug)}" placeholder="url-slug" required style="font-family: var(--mono); font-size: 13px;">
        </div>
        <div class="form-group excerpt-group">
          <label for="excerpt">deck</label>
          <input type="text" id="excerpt" name="excerpt" value="${escapeHtml(post.excerpt || '')}" placeholder="short deck for previews">
        </div>
      </div>

      <div class="editor-main">
        <div class="editor-pane">
          <h3>markdown</h3>
          <div class="md-toolbar">
            <button type="button" onclick="insertMd('**','**')" title="Bold">B</button>
            <button type="button" onclick="insertMd('*','*')" title="Italic"><em>I</em></button>
            <button type="button" onclick="insertMd('~~','~~')" title="Strikethrough"><s>S</s></button>
            <div class="sep"></div>
            <button type="button" onclick="insertMd('# ','')" title="Heading 1">H1</button>
            <button type="button" onclick="insertMd('## ','')" title="Heading 2">H2</button>
            <button type="button" onclick="insertMd('### ','')" title="Heading 3">H3</button>
            <div class="sep"></div>
            <button type="button" onclick="insertMd('[','](url)')" title="Link">[]</button>
            <button type="button" onclick="insertMd('![','](url)')" title="Image">img</button>
            <button type="button" onclick="insertMd('\`','\`')" title="Inline code">\`\`</button>
            <button type="button" onclick="insertBlock('\`\`\`\\n','\\n\`\`\`')" title="Code block">\`\`\`</button>
            <div class="sep"></div>
            <button type="button" onclick="insertMd('> ','')" title="Quote">&gt;</button>
            <button type="button" onclick="insertMd('- ','')" title="List">—</button>
            <button type="button" onclick="insertMd('---\\n','')" title="Horizontal rule">hr</button>
          </div>
          <textarea id="content" name="content" placeholder="write in markdown..." spellcheck="false">${escapeHtml(post.content)}</textarea>
        </div>
        <div class="editor-pane">
          <h3>preview</h3>
          <div id="preview" class="preview-pane prose ${post.content ? '' : 'empty'}">
            ${post.content ? '' : 'preview appears here'}
          </div>
        </div>
      </div>
    </form>

    <div class="editor-status">
      <span id="word-count">0 words</span>
      <span id="char-count">0 chars</span>
      <span>ctrl+s to save</span>
    </div>
  </div>

  <script>
    const isNew = ${isNew};
    const postId = '${post.id}';
    const textarea = document.getElementById('content');
    let previewTimeout;

    function updateCounts() {
      const text = textarea.value;
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      document.getElementById('word-count').textContent = words + ' word' + (words !== 1 ? 's' : '');
      document.getElementById('char-count').textContent = text.length + ' chars';
    }
    updateCounts();

    function insertMd(before, after) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      const replacement = before + (selected || 'text') + after;
      textarea.setRangeText(replacement, start, end, 'select');
      textarea.focus();
      triggerPreview();
    }

    function insertBlock(before, after) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      const replacement = before.replace(/\\\\n/g, '\\n') + (selected || '') + after.replace(/\\\\n/g, '\\n');
      textarea.setRangeText(replacement, start, end, 'select');
      textarea.focus();
      triggerPreview();
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        textarea.setRangeText('  ', start, start, 'end');
        triggerPreview();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        savePost();
      }
    });

    document.getElementById('title').addEventListener('input', (e) => {
      if (isNew || !document.getElementById('slug').dataset.manual) {
        const slug = e.target.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        document.getElementById('slug').value = slug;
      }
    });

    document.getElementById('slug').addEventListener('input', () => {
      document.getElementById('slug').dataset.manual = '1';
    });

    function triggerPreview() {
      clearTimeout(previewTimeout);
      updateCounts();
      previewTimeout = setTimeout(() => updatePreview(textarea.value), 300);
    }
    textarea.addEventListener('input', triggerPreview);

    async function updatePreview(content) {
      const preview = document.getElementById('preview');
      if (!content.trim()) {
        preview.innerHTML = 'preview appears here';
        preview.classList.add('empty');
        return;
      }
      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        const data = await res.json();
        preview.innerHTML = data.html;
        preview.classList.remove('empty');
        if (typeof window.renderDiagrams === 'function') {
          await window.renderDiagrams();
        }
      } catch (err) {
        console.error('Preview error:', err);
      }
    }

    async function savePost() {
      const data = {
        title: document.getElementById('title').value,
        slug: document.getElementById('slug').value,
        content: textarea.value,
        excerpt: document.getElementById('excerpt').value || null,
        published: document.getElementById('published').checked
      };
      if (!data.title || !data.slug || !data.content) return;
      try {
        const url = isNew ? '/api/posts' : '/api/posts/' + postId;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          window.location.href = '/admin';
        }
      } catch (err) {
        console.error('Save error:', err);
      }
    }

    async function deletePost() {
      if (!confirm('Delete this entry?')) return;
      try {
        const res = await fetch('/api/posts/' + postId, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
          window.location.href = '/admin';
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }

    if (textarea.value) {
      updatePreview(textarea.value);
    }
  </script>
  ${diagramInitScript}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
