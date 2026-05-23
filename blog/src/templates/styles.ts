// Shared kit — token-driven, mirrors the kcodes.me palette and type stack
// but tuned for long-form reading (serif body, calm hero, no decoration).
export const baseStyles = `
  :root {
    --bg:        #0a0a0b;
    --bg-2:      #111114;
    --fg:        #f1ece0;
    --fg-prose:  #d8d3c5;
    --fg-dim:    #7a766c;
    --fg-low:    #2a2925;
    --line:      #1c1b18;
    --line-2:    #353330;
    --accent:    #e8541f;
    --accent-dim:#a83a14;
    --ok:        #6fb672;
    --err:       #d24a4a;

    --mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    --display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    --serif:   'Newsreader', 'Source Serif 4', Georgia, serif;
    --italic:  'Instrument Serif', 'Newsreader', Georgia, serif;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: var(--serif);
    background: var(--bg);
    color: var(--fg-prose);
    min-height: 100dvh;
    line-height: 1.65;
    font-size: 17px;
    font-feature-settings: "ss01", "ss02";
  }

  ::selection { background: var(--accent); color: var(--bg); }

  a {
    color: inherit;
    text-decoration: none;
    transition: color 160ms ease;
  }

  /* =========================================================
     LAYOUT
     ========================================================= */
  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    position: relative;
  }
  .container--prose { max-width: 680px; }
  .container--wide  { max-width: 920px; }

  /* =========================================================
     CHIP — small floating top-right status pill (mirrors main site)
     ========================================================= */
  .chip {
    position: fixed;
    z-index: 7;
    top: 18px;
    right: 22px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px 7px 10px;
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--fg);
    background: rgba(10, 10, 11, 0.72);
    border: 1px solid var(--line-2);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    pointer-events: none;
    white-space: nowrap;
  }
  .chip-dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    display: inline-block;
  }
  .chip-label { color: var(--fg-dim); }
  .chip-sep   { color: var(--fg-low); }
  .chip-channel {
    color: var(--accent);
    text-transform: lowercase;
    letter-spacing: 0.05em;
  }

  /* =========================================================
     CORNER BRACKETS — borrowed from main site, used sparingly
     ========================================================= */
  .brackets {
    position: relative;
    padding: 1.5rem 1.75rem;
  }
  .brackets::before,
  .brackets::after,
  .brackets > .br-tl,
  .brackets > .br-tr,
  .brackets > .br-bl,
  .brackets > .br-br {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: var(--fg-dim);
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .brackets > .br-tl { top: -1px; left: -1px;  border-width: 2px 0 0 2px; }
  .brackets > .br-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
  .brackets > .br-bl { bottom: -1px; left: -1px;  border-width: 0 0 2px 2px; }
  .brackets > .br-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

  /* =========================================================
     META — small mono labels (uppercase, letter-spaced)
     ========================================================= */
  .meta {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-dim);
  }
  .meta-accent { color: var(--accent); }
  .meta-fg     { color: var(--fg); }
  .meta-sep    { color: var(--fg-low); padding: 0 0.4em; }
  .meta-num    { font-variant-numeric: tabular-nums; }

  /* =========================================================
     HEADINGS — display, calm scale
     ========================================================= */
  h1, h2, h3, h4 {
    font-family: var(--display);
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--fg);
    text-transform: none;
  }
  h1 { font-size: clamp(1.85rem, 4vw, 2.75rem); }
  h2 { font-size: clamp(1.35rem, 2.6vw, 1.75rem); margin-top: 2.5rem; margin-bottom: 1rem; }
  h3 { font-size: 1.15rem; margin-top: 2rem; margin-bottom: 0.75rem; }

  /* =========================================================
     PROSE — long-form reading
     ========================================================= */
  .prose {
    font-family: var(--serif);
    color: var(--fg-prose);
    font-size: 18px;
    line-height: 1.72;
    max-width: 65ch;
  }

  .prose > * + * { margin-top: 1.2em; }
  .prose h2, .prose h3 { font-family: var(--display); color: var(--fg); }
  .prose h2 { margin-top: 2.4em; margin-bottom: 0.6em; }
  .prose h3 { margin-top: 2em;   margin-bottom: 0.5em; }

  .prose a {
    color: var(--fg);
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
    text-decoration-color: var(--accent);
    transition: text-decoration-color 160ms ease, color 160ms ease;
  }
  .prose a:hover {
    color: var(--accent);
    text-decoration-color: var(--accent);
  }

  .prose strong { color: var(--fg); font-weight: 600; }
  .prose em     { font-family: var(--italic); font-style: italic; color: var(--fg); }

  .prose code {
    font-family: var(--mono);
    font-size: 0.86em;
    background: rgba(241, 236, 224, 0.06);
    border: 1px solid var(--line);
    padding: 0.12em 0.42em;
    color: var(--fg);
  }

  .prose pre {
    background: var(--bg-2);
    border: 1px solid var(--line);
    padding: 1.1rem 1.25rem;
    overflow-x: auto;
    margin: 1.5em 0;
    font-size: 0.86rem;
    line-height: 1.6;
  }
  .prose pre code {
    background: none;
    border: none;
    padding: 0;
    color: var(--fg-prose);
    font-size: 0.92em;
  }

  .prose blockquote {
    border-left: 2px solid var(--accent);
    padding: 0.2em 0 0.2em 1.25em;
    font-family: var(--italic);
    font-style: italic;
    color: var(--fg);
    font-size: 1.1em;
    line-height: 1.55;
  }
  .prose blockquote p { margin: 0; }

  .prose ul, .prose ol { padding-left: 1.5em; margin-top: 1em; margin-bottom: 1em; }
  .prose li { margin-top: 0.35em; }
  .prose li::marker { color: var(--fg-dim); }

  .prose img {
    max-width: 100%;
    display: block;
    margin: 1.75em 0;
    border: 1px solid var(--line);
  }

  .prose hr {
    border: none;
    border-top: 1px solid var(--line);
    margin: 2.5em auto;
    width: 4rem;
    margin-left: 0;
  }

  /* =========================================================
     BUTTONS + INPUTS — calm, hard edges, mono labels
     ========================================================= */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.55rem 1rem;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
    border: 1px solid var(--line-2);
    background: transparent;
    color: var(--fg);
    text-decoration: none;
  }
  .btn:active { transform: translateY(1px); }

  .btn-primary {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
  }
  .btn-primary:hover {
    background: var(--accent-dim);
    border-color: var(--accent-dim);
  }

  .btn-ghost { color: var(--fg-dim); }
  .btn-ghost:hover { color: var(--fg); border-color: var(--fg-dim); }

  .btn-danger { color: var(--err); border-color: rgba(210, 74, 74, 0.35); }
  .btn-danger:hover { background: rgba(210, 74, 74, 0.08); border-color: var(--err); }

  input, textarea {
    width: 100%;
    padding: 0.7rem 0.9rem;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    color: var(--fg);
    font-family: var(--display);
    font-size: 15px;
    transition: border-color 160ms ease;
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  textarea {
    font-family: var(--mono);
    font-size: 13.5px;
    line-height: 1.6;
    resize: vertical;
    min-height: 360px;
  }

  label {
    display: block;
    margin-bottom: 0.45rem;
    color: var(--fg-dim);
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* =========================================================
     RESPONSIVE
     ========================================================= */
  @media (max-width: 720px) {
    body { font-size: 16px; }
    .container { padding: 1.5rem 1.1rem; }
    .prose { font-size: 17px; line-height: 1.7; }
    .chip { top: 12px; right: 12px; padding: 6px 10px; font-size: 9.5px; }
    .chip-channel { display: none; }
  }
`;

// Single subtle fade so the page doesn't snap in cold. No cascades.
export const baseAnim = `
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  body { animation: fade-in 220ms ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    body { animation: none; }
  }
`;

export const themeScript = '';
export const themeToggleHTML = '';

export const baseHead = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0a0a0b">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Instrument+Serif:ital@0;1&display=swap">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%230a0a0b'/><circle cx='8' cy='8' r='3' fill='%23e8541f'/><circle cx='8' cy='8' r='1' fill='%23f1ece0'/></svg>">
  <style>${baseStyles}${baseAnim}</style>
`;
