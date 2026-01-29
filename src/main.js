import { renderMermaid, THEMES } from 'beautiful-mermaid';
import mermaid from 'mermaid';

// AWS HealthOmics Genomic Pipeline - Simplified Architecture
const genomicPipelineDiagram = `
flowchart LR
    subgraph Input[Data Input]
        RAW[FASTQ / BAM]
    end

    subgraph Storage[S3 Storage]
        S3[(S3 Bucket)]
    end

    subgraph Omics[AWS HealthOmics]
        SEQ[Sequence Store]
        WF[Workflows]
        VAR[Variant Store]
        ANN[Annotations]
    end

    subgraph Analysis[Analytics]
        ATHENA[Athena]
        ML[SageMaker]
    end

    subgraph Output[Results]
        DASH[Dashboard]
        REPORT[Reports]
    end

    RAW --> S3
    S3 --> SEQ
    SEQ --> WF
    WF --> VAR
    VAR --> ANN
    ANN --> S3
    S3 --> ATHENA
    ATHENA --> ML
    ML --> DASH
    ML --> REPORT
`;

const beautifulContainer = document.getElementById('diagram-beautiful');
const mermaidContainer = document.getElementById('diagram-mermaid');
let currentTheme = 'tokyo-night';

// Map beautiful-mermaid themes to mermaid.js themes
const mermaidThemeMap = {
  'tokyo-night': 'dark',
  'catppuccin-mocha': 'dark',
  'nord': 'dark',
  'dracula': 'dark',
  'github-light': 'default'
};

// Render with beautiful-mermaid
async function renderBeautiful(themeName) {
  try {
    beautifulContainer.innerHTML = '<span class="loading">Rendering...</span>';
    const theme = THEMES[themeName] || THEMES['tokyo-night'];
    const svgString = await renderMermaid(genomicPipelineDiagram, theme);
    beautifulContainer.innerHTML = svgString;

    // Update container background
    beautifulContainer.closest('.diagram-container').style.background = theme.bg;
  } catch (error) {
    console.error('beautiful-mermaid error:', error);
    beautifulContainer.innerHTML = `<span class="loading">Error: ${error.message}</span>`;
  }
}

// Render with original mermaid.js
async function renderMermaidJs(themeName) {
  try {
    mermaidContainer.innerHTML = '<span class="loading">Rendering...</span>';

    const mermaidTheme = mermaidThemeMap[themeName] || 'dark';
    const isDark = mermaidTheme === 'dark';

    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      themeVariables: isDark ? {
        primaryColor: '#3d59a1',
        primaryTextColor: '#a9b1d6',
        primaryBorderColor: '#565f89',
        lineColor: '#565f89',
        secondaryColor: '#292e42',
        tertiaryColor: '#1a1b26'
      } : {}
    });

    const { svg } = await mermaid.render('mermaid-svg', genomicPipelineDiagram);
    mermaidContainer.innerHTML = svg;

    // Update container background
    const bg = isDark ? '#1a1b26' : '#ffffff';
    mermaidContainer.closest('.diagram-container').style.background = bg;
  } catch (error) {
    console.error('mermaid.js error:', error);
    mermaidContainer.innerHTML = `<span class="loading">Error: ${error.message}</span>`;
  }
}

// Render both diagrams
async function renderBoth(themeName) {
  await Promise.all([
    renderBeautiful(themeName),
    renderMermaidJs(themeName)
  ]);
}

// Theme button handlers
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTheme = btn.dataset.theme;
    renderBoth(currentTheme);
  });
});

// Initial render
renderBoth(currentTheme);
