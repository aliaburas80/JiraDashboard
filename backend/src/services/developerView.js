// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
function renderDeveloperWiki() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Delivery Clarity — Developer Wiki</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; }
    :root {
      --sidebar-bg: #111827;
      --sidebar-text: #f8fafc;
      --sidebar-muted: #cbd5e1;
      --sidebar-active-bg: #2563eb;
      --sidebar-active-text: #ffffff;
      --sidebar-hover-bg: #1e293b;
      --body-bg: #eef2f7;
      --content-bg: #ffffff;
      --border: #e1e5eb;
      --text: #172033;
      --muted: #64748b;
      --heading: #0f172a;
      --accent: #2563eb;
      --accent-dark: #1d4ed8;
      --green: #16a34a;
      --amber: #d97706;
      --red: #dc2626;
      /* Code syntax */
      --code-bg: #0d1117;
      --code-text: #e1e4e8;
      --code-kw: #c792ea;
      --code-str: #c3e88d;
      --code-num: #f78c6c;
      --code-comment: #546e7a;
      --code-fn: #82aaff;
      --code-border: #30363d;
    }
    html { color-scheme: light; font-family: Inter, system-ui, -apple-system, sans-serif; color: var(--text); background: var(--body-bg); }
    body { margin: 0; }
    h1, h2, h3, h4, p { margin-top: 0; }

    /* ── Layout ── */
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
    }

    /* ── Sidebar ── */
    aside {
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      padding: 24px 18px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #374151 transparent;
    }
    aside::-webkit-scrollbar { width: 4px; }
    aside::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    .brand { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #1f2937; }
    .brand strong { display: block; font-size: 1.05rem; letter-spacing: -0.01em; }
    .brand span { color: var(--sidebar-muted); font-size: 0.82rem; display: block; margin-top: 2px; }
    .brand .wiki-badge {
      display: inline-block;
      margin-top: 8px;
      background: #2563eb22;
      color: #93c5fd;
      border: 1px solid #2563eb44;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    nav { display: grid; gap: 3px; }
    .nav-section-label {
      color: #475569;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 14px 10px 4px;
    }
    nav a {
      border-radius: 7px;
      color: var(--sidebar-muted);
      padding: 9px 12px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s, color 0.15s;
    }
    nav a:hover { background: var(--sidebar-hover-bg); color: var(--sidebar-text); }
    nav a.active { background: var(--sidebar-active-bg); color: var(--sidebar-active-text); }
    nav a .nav-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 4px;
      background: #1f2937;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    nav a.active .nav-num { background: #1d4ed8; color: #bfdbfe; }
    .nav-divider { border: none; border-top: 1px solid #1f2937; margin: 10px 0; }

    /* ── Main ── */
    main {
      padding: 40px 48px;
      max-width: 960px;
    }
    .wiki-hero {
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 2px solid var(--border);
    }
    .wiki-hero h1 {
      font-size: 2.2rem;
      font-weight: 900;
      color: var(--heading);
      margin-bottom: 8px;
      letter-spacing: -0.03em;
    }
    .wiki-hero p {
      color: var(--muted);
      font-size: 1.05rem;
      max-width: 580px;
      line-height: 1.6;
    }
    .hero-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .hero-tag {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 700;
      padding: 4px 10px;
    }

    /* ── Sections ── */
    section {
      margin-bottom: 64px;
      scroll-margin-top: 24px;
    }
    .section-eyebrow {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 5px;
      padding: 2px 8px;
      margin-bottom: 8px;
    }
    section h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--heading);
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    section > p {
      color: var(--muted);
      line-height: 1.65;
      margin-bottom: 20px;
      max-width: 680px;
    }
    .section-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 48px 0 0;
    }

    /* ── Subsections ── */
    .subsection { margin-bottom: 32px; }
    .subsection h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--heading);
      margin-bottom: 6px;
    }
    .subsection p {
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    /* ── Code Blocks ── */
    pre {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 10px;
      padding: 20px 22px;
      overflow-x: auto;
      margin: 0 0 16px;
      font-size: 0.84rem;
      line-height: 1.65;
    }
    code {
      font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace;
      color: var(--code-text);
    }
    pre code { display: block; }
    /* Inline code */
    p code, li code, td code, summary code {
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 0.85em;
    }
    .kw { color: var(--code-kw); }
    .fn { color: var(--code-fn); }
    .str { color: var(--code-str); }
    .num { color: var(--code-num); }
    .cm { color: var(--code-comment); font-style: italic; }
    .prop { color: #89ddff; }
    .op { color: #89ddff; }
    .cls { color: #ffcb6b; }
    .tag { color: #f07178; }
    .attr { color: var(--code-fn); }
    .val { color: var(--code-str); }

    /* ── Details/Summary ── */
    details {
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    details[open] { border-color: #bfdbfe; }
    summary {
      cursor: pointer;
      padding: 14px 18px;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--accent-dark);
      background: #f8faff;
      user-select: none;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: "▶";
      font-size: 0.65rem;
      transition: transform 0.2s;
      color: var(--accent);
    }
    details[open] summary::before { transform: rotate(90deg); }
    details[open] summary { border-bottom: 1px solid #bfdbfe; background: #eff6ff; }
    .details-body { padding: 18px; background: var(--content-bg); }
    .details-body pre { margin-bottom: 0; }

    /* ── Info Cards ── */
    .info-card {
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-left: 4px solid transparent;
    }
    .info-card.tip   { background: #f0fdf4; border-color: var(--green); }
    .info-card.warn  { background: #fffbeb; border-color: var(--amber); }
    .info-card.info  { background: #eff6ff; border-color: var(--accent); }
    .info-card p { margin: 0; font-size: 0.88rem; line-height: 1.55; color: var(--text); }
    .info-card strong { display: block; margin-bottom: 4px; }

    /* ── Step List ── */
    ol.steps { padding: 0; margin: 0 0 16px; list-style: none; counter-reset: step; }
    ol.steps li {
      counter-increment: step;
      display: flex;
      gap: 14px;
      margin-bottom: 14px;
      align-items: flex-start;
    }
    ol.steps li::before {
      content: counter(step);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--accent);
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 1px;
    }
    ol.steps li p { margin: 0; font-size: 0.9rem; line-height: 1.55; color: var(--text); }

    /* ── API Table ── */
    .api-table-wrap { overflow-x: auto; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th { background: #f8fafc; color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 14px; border-bottom: 2px solid var(--border); text-align: left; }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .method {
      display: inline-block;
      border-radius: 5px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
    }
    .method.get  { background: #dcfce7; color: #166534; }
    .method.post { background: #dbeafe; color: #1e40af; }

    /* ── Field Aliases Grid ── */
    .alias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .alias-card {
      background: var(--content-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.84rem;
    }
    .alias-card .alias-from { color: var(--muted); font-size: 0.78rem; font-family: monospace; }
    .alias-card .alias-to { color: var(--heading); font-weight: 700; margin-bottom: 2px; }
    .alias-arrow { color: var(--accent); margin: 0 6px; }

    /* ── Color Swatches (Dark Mode / CSS Grid) ── */
    .swatch-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .swatch {
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 0.8rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
      min-width: 120px;
    }

    /* ── Docs Links ── */
    .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .doc-card {
      background: var(--content-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px;
      text-decoration: none;
      color: var(--text);
      display: block;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .doc-card:hover { box-shadow: 0 4px 20px rgba(37,99,235,0.1); border-color: #93c5fd; }
    .doc-card .doc-icon { font-size: 1.6rem; margin-bottom: 10px; }
    .doc-card h4 { font-size: 0.9rem; font-weight: 800; margin: 0 0 4px; color: var(--heading); }
    .doc-card p  { font-size: 0.8rem; color: var(--muted); margin: 0; line-height: 1.5; }

    /* ── Mobile Responsive ── */
    @media (max-width: 820px) {
      .layout { grid-template-columns: 1fr; }
      aside { position: static; height: auto; }
      main { padding: 24px 18px; }
      .docs-grid { grid-template-columns: 1fr 1fr; }
      .alias-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .docs-grid { grid-template-columns: 1fr; }
      main { padding: 16px 14px; }
      section h2 { font-size: 1.3rem; }
    }
  </style>
</head>
<body>
<div class="layout">

  <!-- ══ SIDEBAR ══ -->
  <aside>
    <div class="brand">
      <strong>Delivery Clarity</strong>
      <span>Backend Control Center</span>
      <span class="wiki-badge">Developer Wiki</span>
    </div>

    <nav>
      <div class="nav-section-label">App Navigation</div>
      <a href="http://localhost:3000">
        <span class="nav-num">↗</span> Back to App
      </a>
      <a href="/">
        <span class="nav-num">⌂</span> Control Center
      </a>

      <hr class="nav-divider" />
      <div class="nav-section-label">Developer Guide</div>

      <a href="/developer/guide">
        <span class="nav-num">G</span> Full Guide
      </a>
      <a href="/developer/metrics">
        <span class="nav-num">M</span> Metrics Ref
      </a>
      <a href="/developer/api">
        <span class="nav-num">A</span> API Reference
      </a>
      <a href="/developer/layout">
        <span class="nav-num">L</span> Layout Guide
      </a>

      <hr class="nav-divider" />
      <div class="nav-section-label">Wiki Sections</div>

      <a href="#quick-start"><span class="nav-num">1</span> Quick Start</a>
      <a href="#data-flow"><span class="nav-num">2</span> Data Flow</a>
      <a href="#adding-metric"><span class="nav-num">3</span> Adding a Metric</a>
      <a href="#adding-section"><span class="nav-num">4</span> Adding a Section</a>
      <a href="#field-aliases"><span class="nav-num">5</span> Field Aliases</a>
      <a href="#health-thresholds"><span class="nav-num">6</span> Health Thresholds</a>
      <a href="#layout-grid"><span class="nav-num">7</span> Layout Grid</a>
      <a href="#dark-mode"><span class="nav-num">8</span> Dark Mode Pattern</a>
      <a href="#api-endpoints"><span class="nav-num">9</span> API Endpoints</a>
      <a href="#common-recipes"><span class="nav-num">10</span> Common Recipes</a>
      <a href="#product-docs"><span class="nav-num">11</span> Product Docs</a>
    </nav>
  </aside>

  <!-- ══ MAIN CONTENT ══ -->
  <main>

    <!-- Hero -->
    <div class="wiki-hero">
      <h1>Developer Wiki</h1>
      <p>
        Everything you need to extend, modify, or debug Delivery Clarity.
        Find the exact function, file, and pattern for any task.
      </p>
      <div class="hero-tags">
        <span class="hero-tag">Node.js + Express</span>
        <span class="hero-tag">React 18</span>
        <span class="hero-tag">XLSX Parsing</span>
        <span class="hero-tag">No Build Step Required (Backend)</span>
        <span class="hero-tag">CSS Grid Layout</span>
      </div>
    </div>

    <!-- ─────────────────────────────────────────── -->
    <!-- 1. Quick Start                              -->
    <!-- ─────────────────────────────────────────── -->
    <section id="quick-start">
      <span class="section-eyebrow">Section 1</span>
      <h2>Quick Start</h2>
      <p>
        Get both services running in under two minutes. The backend runs on port 4000,
        the React frontend on port 3000. They communicate via CORS-enabled REST.
      </p>

      <div class="subsection">
        <h3>Prerequisites</h3>
        <p>Node.js ≥ 18 and npm ≥ 9. No database required — logs are stored as JSON files in <code>backend/data/</code>.</p>
      </div>

      <div class="subsection">
        <h3>Install &amp; Run</h3>
        <pre><code><span class="cm"># Clone and bootstrap</span>
<span class="fn">git</span> clone https://github.com/your-org/delivery-clarity.git
<span class="kw">cd</span> delivery-clarity

<span class="cm"># Backend</span>
<span class="kw">cd</span> backend
<span class="fn">npm</span> install
<span class="fn">npm</span> start          <span class="cm"># → http://localhost:4000</span>

<span class="cm"># Frontend (new terminal)</span>
<span class="kw">cd</span> ../frontend
<span class="fn">npm</span> install
<span class="fn">npm</span> start          <span class="cm"># → http://localhost:3000</span></code></pre>
      </div>

      <div class="subsection">
        <h3>Environment Variables</h3>
        <pre><code><span class="cm"># backend/.env (optional)</span>
PORT<span class="op">=</span><span class="num">4000</span>
ALLOWED_ORIGIN<span class="op">=</span><span class="str">http://localhost:3000</span>   <span class="cm"># comma-separated in production</span>

<span class="cm"># frontend/.env (optional — default already points to :4000)</span>
REACT_APP_API_URL<span class="op">=</span><span class="str">http://localhost:4000</span></code></pre>
      </div>

      <div class="subsection">
        <h3>Run Tests</h3>
        <pre><code><span class="kw">cd</span> backend
<span class="fn">npm</span> test            <span class="cm"># Jest — backend/tests/metrics.test.js</span></code></pre>
      </div>

      <div class="info-card tip">
        <p><strong>Tip — Hot Reload</strong>
        Use <code>npm run dev</code> (if configured with nodemon) in the backend for auto-restart on file changes.
        The React frontend already has hot reload via Create React App.</p>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 2. Data Flow                                -->
    <!-- ─────────────────────────────────────────── -->
    <section id="data-flow">
      <span class="section-eyebrow">Section 2</span>
      <h2>Data Flow</h2>
      <p>
        Understanding how a Jira export travels from the user's browser to a fully rendered dashboard
        is essential before modifying any part of the pipeline.
      </p>

      <div class="subsection">
        <h3>End-to-End Pipeline</h3>
        <pre><code><span class="cm">// 1. User drops an .xlsx / .csv file in UploadPage.js
//    POST /api/upload   (multipart/form-data, field name: "file")</span>

<span class="cm">// 2. backend/src/routes/upload.js  — multer validates size &amp; type</span>
<span class="kw">const</span> <span class="prop">parseResult</span> <span class="op">=</span> <span class="fn">parseJiraFile</span>(req.file);   <span class="cm">// parser.js</span>
<span class="kw">const</span> <span class="prop">validation</span>  <span class="op">=</span> <span class="fn">validateIssueData</span>(issues);  <span class="cm">// validation.js</span>
<span class="kw">const</span> <span class="prop">metrics</span>     <span class="op">=</span> <span class="fn">calculateDashboardMetrics</span>(issues); <span class="cm">// metrics.js</span>

<span class="cm">// 3. Response JSON shape:
//    { issues, warnings, metrics, importLog }</span>

<span class="cm">// 4. DashboardPage.js receives metrics and renders sections
//    Data never leaves the browser after the initial response.</span></code></pre>
      </div>

      <details>
        <summary>Deep dive — parseJiraFile (parser.js)</summary>
        <div class="details-body">
          <p style="color:var(--muted);font-size:0.88rem;margin-bottom:12px;">
            Reads the uploaded buffer with the <code>xlsx</code> library,
            normalises every header through <code>FIELD_ALIASES</code>,
            and returns a clean <code>issues[]</code> array with canonical field names.
          </p>
          <pre><code><span class="kw">function</span> <span class="fn">parseJiraFile</span>(file) {
  <span class="kw">const</span> <span class="prop">workbook</span> <span class="op">=</span> XLSX.<span class="fn">read</span>(file.buffer, { type: <span class="str">'buffer'</span> });
  <span class="kw">const</span> <span class="prop">rawRows</span>  <span class="op">=</span> XLSX.utils.<span class="fn">sheet_to_json</span>(worksheet, { defval: <span class="str">''</span> });
  <span class="kw">const</span> <span class="prop">issues</span>   <span class="op">=</span> rawRows.<span class="fn">map</span>(normalizeRow);  <span class="cm">// applies FIELD_ALIASES</span>
  <span class="kw">return</span> { issues, warnings, headers, sheetName };
}</code></pre>
        </div>
      </details>

      <details>
        <summary>Deep dive — calculateDashboardMetrics (metrics.js)</summary>
        <div class="details-body">
          <p style="color:var(--muted);font-size:0.88rem;margin-bottom:12px;">
            Orchestrates all metric builders. Each builder is a pure function — easy to test and extend.
          </p>
          <pre><code><span class="kw">function</span> <span class="fn">calculateDashboardMetrics</span>(issues) {
  <span class="kw">const</span> <span class="prop">flowItems</span> <span class="op">=</span> issues.<span class="fn">map</span>(<span class="fn">getHealthFromIssue</span>);
  <span class="kw">const</span> <span class="prop">flow</span>      <span class="op">=</span> <span class="fn">buildFlowMetrics</span>(flowItems);
  <span class="kw">const</span> <span class="prop">sprint</span>    <span class="op">=</span> <span class="fn">buildSprintMetrics</span>(issues, flowItems);
  <span class="kw">const</span> <span class="prop">capacity</span>  <span class="op">=</span> <span class="fn">buildCapacityMetrics</span>(issues);
  <span class="kw">const</span> <span class="prop">epics</span>     <span class="op">=</span> <span class="fn">buildEpicMetrics</span>(issues, flowItems);
  <span class="kw">const</span> <span class="prop">relations</span> <span class="op">=</span> <span class="fn">buildLinksMetrics</span>(issues);
  <span class="kw">const</span> <span class="prop">healthScore</span> <span class="op">=</span> <span class="fn">calculateHealthScore</span>(metrics);
  <span class="kw">return</span> { ...metrics, healthScore };
}</code></pre>
        </div>
      </details>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 3. Adding a Metric                          -->
    <!-- ─────────────────────────────────────────── -->
    <section id="adding-metric">
      <span class="section-eyebrow">Section 3</span>
      <h2>Adding a Metric</h2>
      <p>
        A metric is a computed value derived from the <code>issues[]</code> array.
        Follow this recipe to add a new metric end-to-end — from backend calculation to frontend KPI card.
      </p>

      <ol class="steps">
        <li><p><strong>Write a builder function</strong> in <code>backend/src/services/metrics.js</code>.
            Keep it pure: it receives <code>issues[]</code> (or <code>flowItems[]</code>) and returns a plain object.</p></li>
        <li><p><strong>Register it</strong> inside <code>calculateDashboardMetrics</code> and add the key to the returned object.</p></li>
        <li><p><strong>Surface it</strong> in <code>frontend/src/components/DashboardPage.js</code> by reading <code>data.yourMetric</code>
            and rendering a <code>&lt;KpiCard&gt;</code>.</p></li>
        <li><p><strong>Write a test</strong> in <code>backend/tests/metrics.test.js</code> with a minimal issues fixture.</p></li>
      </ol>

      <details>
        <summary>Example — adding a "Reopened Rate" metric</summary>
        <div class="details-body">
          <pre><code><span class="cm">// Step 1 — backend/src/services/metrics.js</span>
<span class="kw">function</span> <span class="fn">buildReopenedMetrics</span>(issues) {
  <span class="kw">const</span> <span class="prop">reopened</span> <span class="op">=</span> issues.<span class="fn">filter</span>(
    (i) <span class="op">=></span> <span class="fn">parseNumber</span>(i[<span class="str">'Reopened Count'</span>]) <span class="op">></span> <span class="num">0</span>
  );
  <span class="kw">return</span> {
    reopenedCount: reopened.length,
    reopenedRate: issues.length
      <span class="op">?</span> <span class="cls">Math</span>.<span class="fn">round</span>((reopened.length <span class="op">/</span> issues.length) <span class="op">*</span> <span class="num">100</span>)
      <span class="op">:</span> <span class="num">0</span>,
  };
}

<span class="cm">// Step 2 — add inside calculateDashboardMetrics</span>
<span class="kw">const</span> <span class="prop">reopened</span> <span class="op">=</span> <span class="fn">buildReopenedMetrics</span>(issues);
<span class="kw">return</span> { ...metrics, reopened };

<span class="cm">// Step 3 — DashboardPage.js (inside your section JSX)</span>
&lt;<span class="tag">KpiCard</span>
  <span class="attr">label</span><span class="op">=</span><span class="str">"Reopened Rate"</span>
  <span class="attr">value</span><span class="op">=</span>{<span class="str">\`\${data.reopened.reopenedRate}%\`</span>}
  <span class="attr">detail</span><span class="op">=</span>{<span class="str">\`\${data.reopened.reopenedCount} issues\`</span>}
  <span class="attr">accent</span><span class="op">=</span><span class="str">"amber"</span>
/&gt;</code></pre>
        </div>
      </details>

      <div class="info-card info">
        <p><strong>KpiCard props reference</strong><br />
        <code>label</code> — string below the value &bull;
        <code>value</code> — the big number / string &bull;
        <code>detail</code> — small subtext &bull;
        <code>accent</code> — <code>"blue" | "green" | "amber" | "red"</code> &bull;
        <code>onClick</code> — makes it a button &bull;
        <code>thresholds</code> — <code>{ good, warning, critical, max, unit }</code> shows a threshold bar</p>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 4. Adding a Section                         -->
    <!-- ─────────────────────────────────────────── -->
    <section id="adding-section">
      <span class="section-eyebrow">Section 4</span>
      <h2>Adding a Section</h2>
      <p>
        Dashboard sections are the collapsible panels (Summary, KPIs, Sprint, etc.).
        Each section is a <code>&lt;section&gt;</code> tag with a matching ID registered in <code>DASHBOARD_SECTIONS</code>.
      </p>

      <ol class="steps">
        <li><p>Add your entry to the <code>DASHBOARD_SECTIONS</code> array in <code>DashboardPage.js</code>.
            This automatically registers it in the sticky section nav.</p></li>
        <li><p>Add a <code>&lt;section id="section-your-name"&gt;</code> in the render output.
            Use <code>&lt;SectionHeader&gt;</code> for consistent heading style.</p></li>
        <li><p>Inside the section, use <code>&lt;MetricTable&gt;</code>, <code>&lt;CompactBarChart&gt;</code>,
            or <code>&lt;DistributionDonut&gt;</code> to render data.</p></li>
        <li><p>Pass new backend data through the <code>data</code> prop — no new API routes needed.</p></li>
      </ol>

      <details>
        <summary>Example — adding a "Risk Heatmap" section</summary>
        <div class="details-body">
          <pre><code><span class="cm">// 1. Register in DASHBOARD_SECTIONS array</span>
<span class="kw">const</span> <span class="cls">DASHBOARD_SECTIONS</span> <span class="op">=</span> [
  <span class="cm">// ...existing entries...</span>
  { id: <span class="str">'section-risk-heatmap'</span>, label: <span class="str">'Risk Heatmap'</span>, color: <span class="str">'#dc2626'</span> },
];

<span class="cm">// 2. Add the section JSX in DashboardPage render</span>
&lt;<span class="tag">section</span> <span class="attr">id</span><span class="op">=</span><span class="str">"section-risk-heatmap"</span>&gt;
  &lt;<span class="tag">SectionHeader</span>
    <span class="attr">icon</span><span class="op">=</span><span class="str">"🔥"</span>
    <span class="attr">kicker</span><span class="op">=</span><span class="str">"Risk Analysis"</span>
    <span class="attr">title</span><span class="op">=</span><span class="str">"Risk Heatmap"</span>
    <span class="attr">detail</span><span class="op">=</span><span class="str">"Issues by risk level and age"</span>
    <span class="attr">helpTopic</span><span class="op">=</span><span class="str">"risk-heatmap"</span>
    <span class="attr">onOpenHelp</span><span class="op">=</span>{onOpenHelp}
  /&gt;
  &lt;<span class="tag">MetricTable</span>
    <span class="attr">columns</span><span class="op">=</span>{columns}
    <span class="attr">rows</span><span class="op">=</span>{data.risk.riskItems}
    <span class="attr">emptyMessage</span><span class="op">=</span><span class="str">"No risk data."</span>
  /&gt;
&lt;/<span class="tag">section</span>&gt;</code></pre>
        </div>
      </details>

      <div class="info-card tip">
        <p><strong>SectionHeader props</strong> — <code>icon</code> (emoji), <code>kicker</code> (uppercase label),
        <code>title</code> (h3), <code>detail</code> (subtitle paragraph), <code>helpTopic</code> (string key for HelpGuide),
        <code>onOpenHelp</code> (callback from parent).</p>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 5. Field Aliases                            -->
    <!-- ─────────────────────────────────────────── -->
    <section id="field-aliases">
      <span class="section-eyebrow">Section 5</span>
      <h2>Field Aliases</h2>
      <p>
        Jira exports vary by instance configuration. <code>FIELD_ALIASES</code> in
        <code>backend/src/services/parser.js</code> maps every known column name variant
        to the canonical field name used throughout the app.
      </p>

      <div class="subsection">
        <h3>How Aliasing Works</h3>
        <pre><code><span class="cm">// parser.js — canonicalizeHeader normalises then looks up the alias</span>
<span class="kw">const</span> <span class="fn">canonicalizeHeader</span> <span class="op">=</span> (key) <span class="op">=></span> {
  <span class="kw">const</span> <span class="prop">normalizedKey</span> <span class="op">=</span> <span class="fn">normalizeHeader</span>(key);          <span class="cm">// strip BOM, trim</span>
  <span class="kw">const</span> <span class="prop">aliasKey</span>      <span class="op">=</span> normalizedKey.<span class="fn">toLowerCase</span>()
                          .<span class="fn">replace</span>(<span class="op">/</span>\s+<span class="op">/</span>g, <span class="str">' '</span>);   <span class="cm">// lowercase + single-space</span>
  <span class="kw">return</span> <span class="cls">FIELD_ALIASES</span>[aliasKey] <span class="op">||</span> normalizedKey;
};</code></pre>
      </div>

      <div class="subsection">
        <h3>Adding a New Alias</h3>
        <ol class="steps">
          <li><p>Open <code>backend/src/services/parser.js</code> and find the <code>FIELD_ALIASES</code> object.</p></li>
          <li><p>Add a key/value pair where the key is the Jira column name in lowercase (spaces collapsed to single space)
              and the value is the canonical field name used in metrics.js.</p></li>
          <li><p>Re-upload any test file — the header will now normalise correctly.</p></li>
        </ol>
        <pre><code><span class="kw">const</span> <span class="cls">FIELD_ALIASES</span> <span class="op">=</span> {
  <span class="cm">// ...existing aliases...</span>
  <span class="str">'custom field (acceptance criteria)'</span>: <span class="str">'Acceptance Criteria Ready'</span>,
  <span class="str">'ac ready'</span>:                            <span class="str">'Acceptance Criteria Ready'</span>,
  <span class="str">'story point estimate'</span>:               <span class="str">'Story Points'</span>,   <span class="cm">// NextGen projects</span>
  <span class="str">'team name'</span>:                           <span class="str">'Team'</span>,
};</code></pre>
      </div>

      <div class="subsection">
        <h3>Key Aliases Currently Configured</h3>
        <div class="alias-grid">
          <div class="alias-card"><div class="alias-to">Issue Key</div><div class="alias-from">issue key</div></div>
          <div class="alias-card"><div class="alias-to">Story Points</div><div class="alias-from">custom field (story points) · custom field (story point estimate)</div></div>
          <div class="alias-card"><div class="alias-to">Epic Link</div><div class="alias-from">custom field (epic link) · custom field (epic name)</div></div>
          <div class="alias-card"><div class="alias-to">Sprint Start</div><div class="alias-from">custom field (start date) · custom field (target start)</div></div>
          <div class="alias-card"><div class="alias-to">Done Date</div><div class="alias-from">custom field (actual end)</div></div>
          <div class="alias-card"><div class="alias-to">In Progress Date</div><div class="alias-from">custom field (actual start)</div></div>
          <div class="alias-card"><div class="alias-to">Resolution Date</div><div class="alias-from">resolved</div></div>
          <div class="alias-card"><div class="alias-to">High Level Status</div><div class="alias-from">status category</div></div>
          <div class="alias-card"><div class="alias-to">Team</div><div class="alias-from">custom field (team)</div></div>
          <div class="alias-card"><div class="alias-to">Last Comment</div><div class="alias-from">comment</div></div>
        </div>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 6. Health Thresholds                        -->
    <!-- ─────────────────────────────────────────── -->
    <section id="health-thresholds">
      <span class="section-eyebrow">Section 6</span>
      <h2>Health Thresholds</h2>
      <p>
        Issue health (<code>good</code> / <code>warning</code> / <code>critical</code>) is determined by
        <code>getHealthFromIssue</code> in <code>backend/src/services/metrics.js</code>.
        All thresholds are simple integer constants — change them in one place to affect every metric and chart.
      </p>

      <div class="subsection">
        <h3>Current Threshold Logic</h3>
        <pre><code><span class="cm">// backend/src/services/metrics.js — getHealthFromIssue()</span>

<span class="cm">// DONE issues — measured by cycle time</span>
<span class="kw">if</span> (cycleTimeDays <span class="op">></span> <span class="num">14</span>)  health <span class="op">=</span> <span class="str">'critical'</span>;  <span class="cm">// change 14 to adjust</span>
<span class="kw">if</span> (cycleTimeDays <span class="op">></span> <span class="num">7</span>)   health <span class="op">=</span> <span class="str">'warning'</span>;   <span class="cm">// change 7  to adjust</span>

<span class="cm">// ACTIVE (In Progress) issues — measured by active age</span>
<span class="kw">if</span> (activeAgeDays <span class="op">></span> <span class="num">14</span>)  health <span class="op">=</span> <span class="str">'critical'</span>;
<span class="kw">if</span> (activeAgeDays <span class="op">></span> <span class="num">7</span>)   health <span class="op">=</span> <span class="str">'warning'</span>;

<span class="cm">// BACKLOG issues — measured by total age</span>
<span class="kw">if</span> (ageDays <span class="op">></span> <span class="num">30</span>)         health <span class="op">=</span> <span class="str">'warning'</span>;

<span class="cm">// Override rules (applied after base health)</span>
<span class="kw">if</span> (isBlocked)             health <span class="op">=</span> <span class="str">'critical'</span>;  <span class="cm">// Blocked Flag = true</span>
<span class="kw">if</span> (isOverdue)             health <span class="op">=</span> <span class="str">'critical'</span>;  <span class="cm">// Due Date &lt; today</span>
<span class="kw">if</span> (isHighPriority <span class="op">&amp;&amp;</span> !isDone <span class="op">&amp;&amp;</span> health <span class="op">===</span> <span class="str">'good'</span>) health <span class="op">=</span> <span class="str">'warning'</span>;</code></pre>
      </div>

      <div class="subsection">
        <h3>Overall Health Score Formula</h3>
        <pre><code><span class="cm">// calculateHealthScore() — weighted composite score 0–100</span>
<span class="kw">const</span> <span class="prop">raw</span> <span class="op">=</span>
  completionRate       <span class="op">*</span> <span class="num">0.28</span> <span class="op">+</span>   <span class="cm">// 28% — % done</span>
  (1 - criticalRatio)  <span class="op">*</span> <span class="num">100</span> <span class="op">*</span> <span class="num">0.24</span> <span class="op">+</span>  <span class="cm">// 24% — critical items</span>
  (1 - warningRatio)   <span class="op">*</span> <span class="num">100</span> <span class="op">*</span> <span class="num">0.12</span> <span class="op">+</span>  <span class="cm">// 12% — warning items</span>
  latestSprintRate     <span class="op">*</span> <span class="num">0.14</span> <span class="op">+</span>   <span class="cm">// 14% — sprint completion</span>
  (1 - orphanRatio)    <span class="op">*</span> <span class="num">100</span> <span class="op">*</span> <span class="num">0.12</span> <span class="op">+</span>  <span class="cm">// 12% — orphan items</span>
  cycleScore           <span class="op">*</span> <span class="num">0.10</span>;    <span class="cm">// 10% — cycle time score</span></code></pre>
      </div>

      <div class="info-card warn">
        <p><strong>Changing thresholds?</strong> Update the matching <code>thresholds</code> prop on the relevant
        <code>&lt;KpiCard&gt;</code> in <code>DashboardPage.js</code> so the visual threshold bar stays in sync.</p>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 7. Layout Grid                              -->
    <!-- ─────────────────────────────────────────── -->
    <section id="layout-grid">
      <span class="section-eyebrow">Section 7</span>
      <h2>Layout Grid</h2>
      <p>
        The frontend uses CSS Grid throughout. There is no layout framework — all classes
        are defined in <code>frontend/src/styles.css</code>. Key grid classes and breakpoints follow.
      </p>

      <div class="subsection">
        <h3>App Shell</h3>
        <pre><code><span class="cm">/* The outer shell — single column, full viewport */</span>
.app.shell {
  min-height: 100vh;
  padding: 20px 16px 26px;
}

<span class="cm">/* Header floats sticky at top */</span>
.app-header {
  position: sticky;
  top: 16px;
  z-index: 10;
  max-width: 1480px;
  margin: 0 auto 20px;
  border-radius: 30px;
  backdrop-filter: blur(16px);
}</code></pre>
      </div>

      <div class="subsection">
        <h3>KPI Card Grid</h3>
        <pre><code><span class="cm">/* Responsive auto-fill grid — cards shrink to 160px minimum */</span>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

<span class="cm">/* Individual KPI card */</span>
.kpi-card {
  border-radius: 14px;
  padding: 18px 20px;
  background: #fff;
  position: relative;
  overflow: hidden;
}</code></pre>
      </div>

      <div class="subsection">
        <h3>Dashboard Panel Grid</h3>
        <pre><code><span class="cm">/* Two-column panel layout */</span>
.dashboard-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

<span class="cm">/* Three-column variant */</span>
.dashboard-three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

<span class="cm">/* Full-width panel */</span>
.dashboard-panel {
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  border: 1px solid #e1e5eb;
}</code></pre>
      </div>

      <div class="subsection">
        <h3>Breakpoints</h3>
        <pre><code><span class="cm">/* Mobile — stack everything */</span>
@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .dashboard-two-col,
  .dashboard-three-col { grid-template-columns: 1fr; }
}

<span class="cm">/* Tablet */</span>
@media (max-width: 1024px) {
  .dashboard-three-col { grid-template-columns: 1fr 1fr; }
}

<span class="cm">/* The section nav hides on small screens */</span>
@media (max-width: 860px) {
  .section-nav { display: none; }
}</code></pre>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 8. Dark Mode Pattern                        -->
    <!-- ─────────────────────────────────────────── -->
    <section id="dark-mode">
      <span class="section-eyebrow">Section 8</span>
      <h2>Dark Mode Pattern</h2>
      <p>
        Dark mode is a CSS-only toggle. Adding the <code>.dark</code> class to <code>&lt;body&gt;</code>
        (or any ancestor) flips CSS custom properties to their dark values. No JS framework or library needed.
      </p>

      <div class="subsection">
        <h3>Variable Override Pattern</h3>
        <pre><code><span class="cm">/* styles.css — light mode defaults */</span>
:root {
  --bg:        #edf2f7;
  --surface:   #ffffff;
  --text:      #172033;
  --muted:     #64748b;
  --border:    #e1e5eb;
  --accent:    #2563eb;
}

<span class="cm">/* Dark mode overrides — flip all design tokens */</span>
.dark {
  --bg:        #0f172a;
  --surface:   #1e293b;
  --text:      #f1f5f9;
  --muted:     #94a3b8;
  --border:    #334155;
  --accent:    #60a5fa;
}

<span class="cm">/* All components use var() — zero per-component dark-mode code */</span>
.dashboard-panel {
  background: <span class="fn">var</span>(--surface);
  border-color: <span class="fn">var</span>(--border);
  color: <span class="fn">var</span>(--text);
}</code></pre>
      </div>

      <div class="subsection">
        <h3>Toggling Dark Mode in React</h3>
        <pre><code><span class="cm">// In App.js or a context provider</span>
<span class="kw">const</span> [dark, setDark] <span class="op">=</span> <span class="fn">useState</span>(
  () <span class="op">=></span> <span class="cls">localStorage</span>.<span class="fn">getItem</span>(<span class="str">'theme'</span>) <span class="op">===</span> <span class="str">'dark'</span>
);

<span class="fn">useEffect</span>(() <span class="op">=></span> {
  document.body.<span class="prop">classList</span>.<span class="fn">toggle</span>(<span class="str">'dark'</span>, dark);
  <span class="cls">localStorage</span>.<span class="fn">setItem</span>(<span class="str">'theme'</span>, dark <span class="op">?</span> <span class="str">'dark'</span> <span class="op">:</span> <span class="str">'light'</span>);
}, [dark]);

<span class="cm">// Toggle button</span>
&lt;<span class="tag">button</span> <span class="attr">onClick</span><span class="op">=</span>{() <span class="op">=></span> <span class="fn">setDark</span>(d <span class="op">=></span> !d)}&gt;
  {dark <span class="op">?</span> <span class="str">'☀️ Light'</span> <span class="op">:</span> <span class="str">'🌙 Dark'</span>}
&lt;/<span class="tag">button</span>&gt;</code></pre>
      </div>

      <div class="info-card tip">
        <p><strong>Adding a new dark-mode-aware component?</strong> Just use <code>var(--surface)</code>,
        <code>var(--text)</code>, <code>var(--border)</code> etc. — never hardcode colour values in component CSS.
        The <code>.dark</code> class cascade does the rest.</p>
      </div>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 9. API Endpoints                            -->
    <!-- ─────────────────────────────────────────── -->
    <section id="api-endpoints">
      <span class="section-eyebrow">Section 9</span>
      <h2>API Endpoints</h2>
      <p>
        All routes are defined in <code>backend/src/routes/upload.js</code> and
        mounted under <code>/api/upload</code> in <code>backend/src/index.js</code>.
      </p>

      <div class="api-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Description</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="method post">POST</span></td>
              <td><code>/api/upload</code></td>
              <td>Upload a Jira .xlsx / .csv export. Multipart field name: <code>file</code>. Max 20 MB. Rate-limited to 20 req/15 min per IP.</td>
              <td><code>{ issues, warnings, metrics, importLog }</code></td>
            </tr>
            <tr>
              <td><span class="method get">GET</span></td>
              <td><code>/api/upload/logs</code></td>
              <td>Raw JSON array of all stored import logs.</td>
              <td><code>{ logs: ImportLog[] }</code></td>
            </tr>
            <tr>
              <td><span class="method get">GET</span></td>
              <td><code>/api/upload/logs/view</code></td>
              <td>Human-readable HTML view of import logs rendered by <code>renderImportLogView()</code>.</td>
              <td>text/html</td>
            </tr>
            <tr>
              <td><span class="method get">GET</span></td>
              <td><code>/api/upload/logs/export</code></td>
              <td>Download import history as an Excel workbook (.xlsx).</td>
              <td>application/vnd.openxmlformats-officedocument.spreadsheetml.sheet</td>
            </tr>
            <tr>
              <td><span class="method get">GET</span></td>
              <td><code>/api/health</code></td>
              <td>Service health check.</td>
              <td><code>{ status: "ok", service, version }</code></td>
            </tr>
            <tr>
              <td><span class="method get">GET</span></td>
              <td><code>/</code></td>
              <td>Backend control center home — rendered by <code>renderBackendHome()</code>.</td>
              <td>text/html</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details>
        <summary>POST /api/upload — full request &amp; response shape</summary>
        <div class="details-body">
          <pre><code><span class="cm">// Request — multipart/form-data</span>
<span class="kw">const</span> <span class="prop">form</span> <span class="op">=</span> <span class="kw">new</span> <span class="cls">FormData</span>();
form.<span class="fn">append</span>(<span class="str">'file'</span>, fileInput.files[0]);
<span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'/api/upload'</span>, { method: <span class="str">'POST'</span>, body: form });

<span class="cm">// Success 200 response shape</span>
{
  issues:    Issue[],       <span class="cm">// normalised issue objects</span>
  warnings:  string[],     <span class="cm">// missing optional field warnings</span>
  metrics:   DashboardMetrics,
  importLog: ImportLog
}

<span class="cm">// Error 422 — validation failed</span>
{ error: <span class="str">'Validation failed'</span>, details: string[], importLog }

<span class="cm">// Error 413 — file too large</span>
{ error: <span class="str">'File exceeds the 20 MB size limit...'</span> }

<span class="cm">// Error 400 — wrong file type / no file</span>
{ error: string }</code></pre>
        </div>
      </details>

      <details>
        <summary>DashboardMetrics object — top-level keys</summary>
        <div class="details-body">
          <pre><code>{
  totalIssues:     number,
  doneIssues:      number,
  activeIssues:    number,
  completionRate:  number,      <span class="cm">// 0–100</span>
  healthScore:     number,      <span class="cm">// 0–100, from calculateHealthScore()</span>
  flow:            FlowMetrics, <span class="cm">// buildFlowMetrics() — health counts, lead/cycle time</span>
  sprint:          SprintMetrics,
  kanban:          { byStatus, byHighLevelStatus },
  capacity:        AssigneeMetric[],
  epics:           EpicMetric[],
  quarters:        QuarterMetric[],
  labels:          LabelMetrics,
  types:           TypeMetric[],
  projects:        ProjectMetric[],
  parents:         ParentMetric[],
  risk:            RiskMetrics,
  relations:       LinkMetrics,  <span class="cm">// buildLinksMetrics()</span>
  storyPoints:     StoryPointMetrics,
  prediction:      PredictionResult,
  insights:        string[],
}</code></pre>
        </div>
      </details>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 10. Common Recipes                          -->
    <!-- ─────────────────────────────────────────── -->
    <section id="common-recipes">
      <span class="section-eyebrow">Section 10</span>
      <h2>Common Recipes</h2>
      <p>
        Copy-paste starting points for the most common extension tasks.
      </p>

      <div class="subsection">
        <h3>Recipe A — Filter flowItems by sprint</h3>
        <pre><code><span class="cm">// Filter flow items to a specific sprint for a focused view</span>
<span class="kw">const</span> <span class="prop">sprintItems</span> <span class="op">=</span> (data.flow?.items <span class="op">||</span> [])
  .<span class="fn">filter</span>((item) <span class="op">=></span> item.sprint <span class="op">===</span> selectedSprint);

<span class="cm">// Then pass to MetricTable or CompactBarChart as normal</span></code></pre>
      </div>

      <div class="subsection">
        <h3>Recipe B — Add a new CompactBarChart</h3>
        <pre><code><span class="cm">// DashboardPage.js — CompactBarChart requires rows with {name, count}</span>
&lt;<span class="tag">CompactBarChart</span>
  <span class="attr">rows</span><span class="op">=</span>{data.types.<span class="fn">map</span>((t) <span class="op">=></span> ({ name: t.type, count: t.count }))}
  <span class="attr">labelKey</span><span class="op">=</span><span class="str">"name"</span>
  <span class="attr">valueKey</span><span class="op">=</span><span class="str">"count"</span>
  <span class="attr">emptyMessage</span><span class="op">=</span><span class="str">"No issue types found."</span>
/&gt;</code></pre>
      </div>

      <div class="subsection">
        <h3>Recipe C — Add a DistributionDonut</h3>
        <pre><code><span class="cm">// DistributionDonut accepts any rows with a label and count key</span>
&lt;<span class="tag">DistributionDonut</span>
  <span class="attr">title</span><span class="op">=</span><span class="str">"Issues by Priority"</span>
  <span class="attr">rows</span><span class="op">=</span>{data.priorities}
  <span class="attr">labelKey</span><span class="op">=</span><span class="str">"priority"</span>
  <span class="attr">valueKey</span><span class="op">=</span><span class="str">"count"</span>
/&gt;</code></pre>
      </div>

      <div class="subsection">
        <h3>Recipe D — Export filtered rows to CSV</h3>
        <pre><code><span class="cm">// csvFromRows() is a helper already in DashboardPage.js</span>
<span class="kw">const</span> <span class="prop">csv</span> <span class="op">=</span> <span class="fn">csvFromRows</span>(filteredRows, columns);
<span class="kw">const</span> <span class="prop">blob</span> <span class="op">=</span> <span class="kw">new</span> <span class="cls">Blob</span>([csv], { type: <span class="str">'text/csv'</span> });
<span class="kw">const</span> <span class="prop">url</span>  <span class="op">=</span> <span class="cls">URL</span>.<span class="fn">createObjectURL</span>(blob);
<span class="kw">const</span> <span class="prop">a</span>    <span class="op">=</span> document.<span class="fn">createElement</span>(<span class="str">'a'</span>);
a.href     <span class="op">=</span> url;
a.download <span class="op">=</span> <span class="str">'export.csv'</span>;
a.<span class="fn">click</span>();</code></pre>
      </div>

      <div class="subsection">
        <h3>Recipe E — Add a SmartActions recommendation</h3>
        <pre><code><span class="cm">// SmartActions derives actions from the metrics object.
// To add a new action type, extend the actions array in the
// useMemo that builds smartActions (DashboardPage.js).</span>
<span class="kw">if</span> (data.risk.openDefects <span class="op">></span> <span class="num">5</span>) {
  actions.<span class="fn">push</span>({
    type:   <span class="str">'critical'</span>,
    icon:   <span class="str">'🐛'</span>,
    title:  <span class="str">\`\${data.risk.openDefects} open defects\`</span>,
    detail: <span class="str">'Bug backlog is growing. Prioritise defect resolution.'</span>,
    target: <span class="str">'flow-health-panel'</span>,
  });
}</code></pre>
      </div>

      <div class="subsection">
        <h3>Recipe F — Render a ManagerReport from outside DashboardPage</h3>
        <pre><code><span class="cm">// ManagerReport is a self-contained modal component.
// Mount it anywhere with the required props:</span>
&lt;<span class="tag">ManagerReport</span>
  <span class="attr">data</span><span class="op">=</span>{metrics}
  <span class="attr">flowItems</span><span class="op">=</span>{metrics.flow.items}
  <span class="attr">epicReadiness</span><span class="op">=</span>{epicReadinessArray}
  <span class="attr">healthStatus</span><span class="op">=</span>{<span class="str">"Healthy"</span>}
  <span class="attr">riskItems</span><span class="op">=</span>{metrics.flow.critical}
  <span class="attr">onClose</span><span class="op">=</span>{() <span class="op">=></span> <span class="fn">setShowReport</span>(<span class="kw">false</span>)}
  <span class="attr">onNavigate</span><span class="op">=</span>{(sectionId) <span class="op">=></span>
    document.<span class="fn">getElementById</span>(sectionId)?.<span class="fn">scrollIntoView</span>({ behavior: <span class="str">'smooth'</span> })
  }
/&gt;</code></pre>
      </div>

      <details>
        <summary>Recipe G — Writing a backend builder test</summary>
        <div class="details-body">
          <pre><code><span class="cm">// backend/tests/metrics.test.js</span>
<span class="kw">const</span> { <span class="fn">calculateDashboardMetrics</span> } <span class="op">=</span> <span class="fn">require</span>(<span class="str">'../src/services/metrics'</span>);

<span class="fn">test</span>(<span class="str">'calculates completion rate correctly'</span>, () <span class="op">=></span> {
  <span class="kw">const</span> <span class="prop">issues</span> <span class="op">=</span> [
    { <span class="str">'Issue Key'</span>: <span class="str">'PROJ-1'</span>, <span class="str">'Issue Type'</span>: <span class="str">'Story'</span>,
      <span class="str">'Summary'</span>: <span class="str">'Feature A'</span>, <span class="str">'Status'</span>: <span class="str">'Done'</span> },
    { <span class="str">'Issue Key'</span>: <span class="str">'PROJ-2'</span>, <span class="str">'Issue Type'</span>: <span class="str">'Story'</span>,
      <span class="str">'Summary'</span>: <span class="str">'Feature B'</span>, <span class="str">'Status'</span>: <span class="str">'In Progress'</span> },
  ];
  <span class="kw">const</span> <span class="prop">result</span> <span class="op">=</span> <span class="fn">calculateDashboardMetrics</span>(issues);
  <span class="fn">expect</span>(result.completionRate).<span class="fn">toBe</span>(<span class="num">50</span>);
  <span class="fn">expect</span>(result.doneIssues).<span class="fn">toBe</span>(<span class="num">1</span>);
});</code></pre>
        </div>
      </details>
    </section>
    <hr class="section-divider" />

    <!-- ─────────────────────────────────────────── -->
    <!-- 11. Product Docs                            -->
    <!-- ─────────────────────────────────────────── -->
    <section id="product-docs">
      <span class="section-eyebrow">Section 11</span>
      <h2>Product Docs</h2>
      <p>
        The <code>product/</code> folder at the repo root contains full product documentation.
        These documents define the requirements, user journeys, and acceptance criteria that
        drove the implementation.
      </p>

      <div class="docs-grid">
        <a class="doc-card" href="/product/README.md" target="_blank" rel="noopener">
          <div class="doc-icon">📖</div>
          <h4>README</h4>
          <p>Project overview, goals, and high-level architecture summary.</p>
        </a>
        <a class="doc-card" href="/product/BRD.md" target="_blank" rel="noopener">
          <div class="doc-icon">📋</div>
          <h4>BRD</h4>
          <p>Business Requirements Document — the "why" behind every feature.</p>
        </a>
        <a class="doc-card" href="/product/SRS.md" target="_blank" rel="noopener">
          <div class="doc-icon">📐</div>
          <h4>SRS</h4>
          <p>Software Requirements Specification — functional and non-functional requirements.</p>
        </a>
        <a class="doc-card" href="/product/USE_CASES.md" target="_blank" rel="noopener">
          <div class="doc-icon">👤</div>
          <h4>Use Cases</h4>
          <p>Actor–system interaction diagrams and primary use-case flows.</p>
        </a>
        <a class="doc-card" href="/product/USER_JOURNEYS.md" target="_blank" rel="noopener">
          <div class="doc-icon">🗺️</div>
          <h4>User Journeys</h4>
          <p>End-to-end user journeys mapped by persona (PM, Engineering Lead, Executive).</p>
        </a>
        <a class="doc-card" href="/product/SCENARIOS.md" target="_blank" rel="noopener">
          <div class="doc-icon">🎬</div>
          <h4>Scenarios</h4>
          <p>Concrete usage scenarios and edge-case specifications.</p>
        </a>
        <a class="doc-card" href="/product/TEST_CASES.md" target="_blank" rel="noopener">
          <div class="doc-icon">✅</div>
          <h4>Test Cases</h4>
          <p>Acceptance test cases covering upload, parsing, metrics, and dashboard rendering.</p>
        </a>
      </div>

      <div class="info-card info">
        <p><strong>Local file access</strong> — the links above work if you serve the <code>product/</code> folder
        via a static file server. In development, open the markdown files directly from your editor or via
        <code>cat product/BRD.md | less</code> in the terminal.</p>
      </div>
    </section>

  </main>
</div>
</body>
</html>`;
}

module.exports = { renderDeveloperWiki };
