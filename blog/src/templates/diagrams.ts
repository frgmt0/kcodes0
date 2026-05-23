// Diagram rendering support for blog posts
// Supports: Mermaid (flowcharts, sequence, class, state, ER, pie, gantt, etc.)
//           Chart.js (bar, line, pie, doughnut, radar, etc.)
//           ASCII art (preserved formatting)

export const diagramStyles = `
  .diagram-container {
    margin: 1.75rem 0;
    padding: 1.1rem;
    background: var(--bg-2);
    border: 1px solid var(--line);
    overflow-x: auto;
  }

  .diagram-container.mermaid-diagram { text-align: center; }
  .diagram-container.mermaid-diagram svg { max-width: 100%; height: auto; }

  .diagram-container.chart-diagram {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  .diagram-container.chart-diagram canvas { max-width: 100%; }

  .diagram-container.ascii-diagram {
    font-family: var(--mono);
    font-size: 0.85rem;
    line-height: 1.45;
    white-space: pre;
    overflow-x: auto;
    color: var(--fg-prose);
  }

  .diagram-loading {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--fg-dim);
    padding: 0.5rem 0;
    text-align: center;
  }

  .diagram-error {
    color: var(--err);
    font-family: var(--mono);
    font-size: 0.85rem;
    padding: 0.75rem 1rem;
    background: rgba(210, 74, 74, 0.06);
    border: 1px solid rgba(210, 74, 74, 0.25);
  }

  .mermaid-diagram { --mermaid-bg: transparent; }
  .mermaid-diagram text { fill: var(--fg-prose) !important; }
`;

// CDN scripts for diagram libraries
export const diagramScripts = `
  <!-- Mermaid.js for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <!-- Chart.js for data visualizations -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
`;

// Client-side initialization and rendering code
export const diagramInitScript = `
  <script>
    (function() {
      // Initialize Mermaid with theme support
      function initMermaid() {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#e8541f',
            primaryTextColor: '#f1ece0',
            primaryBorderColor: '#353330',
            lineColor: '#7a766c',
            secondaryColor: '#1c1b18',
            tertiaryColor: '#111114',
            background: '#0a0a0b',
            mainBkg: '#111114',
            nodeBorder: '#e8541f',
            clusterBkg: '#111114',
            titleColor: '#f1ece0',
            edgeLabelBackground: '#111114'
          },
          flowchart: { curve: 'basis', padding: 20 },
          sequence: { actorMargin: 50, messageMargin: 40 },
          gantt: { leftPadding: 75, gridLineStartPadding: 35 }
        });
      }

      // Render all Mermaid diagrams
      async function renderMermaidDiagrams() {
        const diagrams = document.querySelectorAll('.mermaid-source');
        for (const el of diagrams) {
          const container = el.closest('.diagram-container');
          const code = el.textContent;
          try {
            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
            const { svg } = await mermaid.render(id, code);
            container.innerHTML = svg;
            container.classList.add('mermaid-rendered');
          } catch (err) {
            container.innerHTML = '<div class="diagram-error">Diagram error: ' + err.message + '</div>';
            console.error('Mermaid error:', err);
          }
        }
      }

      // Render all Chart.js diagrams
      function renderChartDiagrams() {
        const charts = document.querySelectorAll('.chart-source');
        charts.forEach(el => {
          const container = el.closest('.diagram-container');
          const code = el.textContent;
          try {
            const config = JSON.parse(code);
            const textColor = '#f1ece0';
            const gridColor = 'rgba(241, 236, 224, 0.08)';

            // Vermillion + warm-bone palette stepped from accent to neutral.
            const accentPalette = ['#e8541f', '#c4471a', '#a83a14', '#f1ece0', '#7a766c', '#353330'];

            // Apply theme colors to config
            if (!config.options) config.options = {};
            if (!config.options.plugins) config.options.plugins = {};
            if (!config.options.plugins.legend) config.options.plugins.legend = {};
            config.options.plugins.legend.labels = { color: textColor };

            // Apply accent colors to datasets if no colors specified
            if (config.data && config.data.datasets) {
              config.data.datasets.forEach((dataset, i) => {
                const color = accentPalette[i % accentPalette.length];
                if (!dataset.backgroundColor) {
                  dataset.backgroundColor = config.type === 'line'
                    ? color + '33' : color;
                }
                if (!dataset.borderColor) {
                  dataset.borderColor = color;
                }
                if (config.type === 'line' && dataset.borderWidth === undefined) {
                  dataset.borderWidth = 2;
                }
              });
            }

            if (!config.options.scales) config.options.scales = {};
            ['x', 'y'].forEach(axis => {
              if (!config.options.scales[axis]) config.options.scales[axis] = {};
              config.options.scales[axis].ticks = { color: textColor };
              config.options.scales[axis].grid = { color: gridColor };
            });

            // Create canvas and render chart
            const canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);
            new Chart(canvas.getContext('2d'), config);
            container.classList.add('chart-rendered');
          } catch (err) {
            container.innerHTML = '<div class="diagram-error">Chart error: ' + err.message + '</div>';
            console.error('Chart.js error:', err);
          }
        });
      }

      // Main render function
      window.renderDiagrams = async function() {
        if (typeof mermaid !== 'undefined') {
          initMermaid();
          await renderMermaidDiagrams();
        }
        if (typeof Chart !== 'undefined') {
          renderChartDiagrams();
        }
      };

      // Re-render on theme change
      const originalToggle = document.getElementById('theme-toggle');
      if (originalToggle) {
        originalToggle.addEventListener('click', () => {
          setTimeout(() => {
            // Re-initialize and re-render diagrams with new theme
            window.renderDiagrams();
          }, 700);
        });
      }

      // Initial render when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.renderDiagrams);
      } else {
        window.renderDiagrams();
      }
    })();
  </script>
`;

// Supported diagram types for reference
export const DIAGRAM_TYPES = {
  // Mermaid diagram types
  mermaid: ['mermaid', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
            'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'mindmap', 'timeline',
            'quadrantChart', 'sankey', 'xychart'],
  // Chart.js types
  chart: ['chart', 'barchart', 'linechart', 'piechart', 'doughnut', 'radar', 'polar'],
  // ASCII art
  ascii: ['ascii', 'diagram', 'art']
};

// Transform diagram code blocks to renderable HTML
export function transformDiagramBlock(lang: string, code: string): string | null {
  const langLower = lang.toLowerCase();

  // Mermaid diagrams
  if (DIAGRAM_TYPES.mermaid.includes(langLower)) {
    const mermaidCode = langLower === 'mermaid' ? code : code;
    return `<div class="diagram-container mermaid-diagram"><div class="mermaid-source" style="display:none;">${escapeHtml(mermaidCode)}</div><div class="diagram-loading">Loading diagram...</div></div>`;
  }

  // Chart.js diagrams
  if (DIAGRAM_TYPES.chart.includes(langLower)) {
    return `<div class="diagram-container chart-diagram"><div class="chart-source" style="display:none;">${escapeHtml(code)}</div><div class="diagram-loading">Loading chart...</div></div>`;
  }

  // ASCII art
  if (DIAGRAM_TYPES.ascii.includes(langLower)) {
    return `<div class="diagram-container ascii-diagram">${escapeHtml(code)}</div>`;
  }

  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
