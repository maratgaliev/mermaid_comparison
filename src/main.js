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
    setExportButtonsState('beautiful', false);
    beautifulContainer.innerHTML = '<span class="loading">Rendering...</span>';
    const theme = THEMES[themeName] || THEMES['tokyo-night'];
    const svgString = await renderMermaid(genomicPipelineDiagram, theme);
    beautifulContainer.innerHTML = svgString;

    // Update container background
    beautifulContainer.closest('.diagram-container').style.background = theme.bg;
    setExportButtonsState('beautiful', true);
  } catch (error) {
    console.error('beautiful-mermaid error:', error);
    beautifulContainer.innerHTML = `<span class="loading">Error: ${error.message}</span>`;
    setExportButtonsState('beautiful', false);
  }
}

// Render with original mermaid.js
async function renderMermaidJs(themeName) {
  try {
    setExportButtonsState('mermaid', false);
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
    setExportButtonsState('mermaid', true);
  } catch (error) {
    console.error('mermaid.js error:', error);
    mermaidContainer.innerHTML = `<span class="loading">Error: ${error.message}</span>`;
    setExportButtonsState('mermaid', false);
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

// Export functionality
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function downloadSVG(containerId, filename) {
  try {
    const container = document.getElementById(containerId);
    const svg = container.querySelector('svg');

    if (!svg) {
      alert('No diagram available to export. Please wait for rendering to complete.');
      return;
    }

    // Serialize SVG to string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    // Add XML declaration and proper namespaces if not present
    if (!svgString.includes('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }

    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('SVG export error:', error);
    alert(`Failed to export SVG: ${error.message}`);
  }
}

function downloadPNG(containerId, filename, scale = 2) {
  try {
    const container = document.getElementById(containerId);
    const svg = container.querySelector('svg');

    if (!svg) {
      alert('No diagram available to export. Please wait for rendering to complete.');
      return;
    }

    // Clone SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true);

    // Get SVG dimensions
    const svgRect = svg.getBoundingClientRect();
    const width = svgRect.width * scale;
    const height = svgRect.height * scale;

    // Ensure SVG has explicit dimensions
    svgClone.setAttribute('width', svgRect.width);
    svgClone.setAttribute('height', svgRect.height);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Set background to match container
    const containerBg = window.getComputedStyle(container.closest('.diagram-container')).backgroundColor;
    ctx.fillStyle = containerBg || '#1a1b26';
    ctx.fillRect(0, 0, width, height);

    // Serialize SVG to string and encode as data URI
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    // Load and draw image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to PNG blob and download
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.onerror = () => {
      console.error('Failed to load SVG image');
      alert('Failed to export PNG. Please try again.');
    };

    img.src = svgDataUri;
  } catch (error) {
    console.error('PNG export error:', error);
    alert(`Failed to export PNG: ${error.message}`);
  }
}

function setExportButtonsState(diagramType, enabled) {
  const buttons = document.querySelectorAll(`[data-diagram="${diagramType}"]`);
  buttons.forEach(btn => {
    btn.disabled = !enabled;
  });
}

// Export button handlers
document.querySelectorAll('.export-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const diagramType = btn.dataset.diagram;
    const format = btn.dataset.format;

    // Map diagram type to container ID
    const containerId = diagramType === 'beautiful' ? 'diagram-beautiful' : 'diagram-mermaid';
    const renderer = diagramType === 'beautiful' ? 'beautiful' : 'mermaid';

    // Generate filename
    const timestamp = getTimestamp();
    const filename = `aws-healthomics-${renderer}-${currentTheme}-${timestamp}.${format}`;

    // Call appropriate export function
    if (format === 'svg') {
      downloadSVG(containerId, filename);
    } else if (format === 'png') {
      downloadPNG(containerId, filename);
    }
  });
});

// Initial render
renderBoth(currentTheme);
