(() => {
  const d3Api = window.d3;
  const canvas = document.getElementById("surgery-canvas");
  const stage = document.querySelector(".surgery-stage");
  const stepButtons = [...document.querySelectorAll("[data-surgery-step]")];
  const viewButtons = [...document.querySelectorAll("[data-surgery-view]")];
  const viewportButtons = [...document.querySelectorAll("[data-surgery-viewport]")];
  const previousButton = document.getElementById("surgery-previous");
  const nextButton = document.getElementById("surgery-next");
  const resetButton = document.getElementById("surgery-reset");
  const viewportControls = document.getElementById("surgery-viewport-controls");
  const stageStatus = document.getElementById("surgery-stage-status");
  const stepKicker = document.getElementById("surgery-step-kicker");
  const narrativeTitle = document.getElementById("surgery-narrative-title");
  const principle = document.getElementById("surgery-principle");
  const change = document.getElementById("surgery-change");
  const reason = document.getElementById("surgery-reason");
  const canvasNote = document.getElementById("surgery-canvas-note");
  const summary = document.getElementById("surgery-summary");

  if (!d3Api || !canvas || !stage || !stepButtons.length || !previousButton || !nextButton || !resetButton || !viewportControls) return;

  const CANVAS_WIDTH = 1000;
  const moduleSpecs = [
    { id: "dashboard-header", kind: "header", shortLabel: "Dashboard 标题", value: "FRESHMAN SNAPSHOT" },
    { id: "filters", kind: "filters", shortLabel: "Filters", value: "Region · Major group" },
    { id: "kpi-total", kind: "kpi", shortLabel: "新生总数", value: "1,432" },
    { id: "kpi-major", kind: "kpi", shortLabel: "专业数量", value: "8" },
    { id: "kpi-region", kind: "kpi", shortLabel: "生源区域", value: "7" },
    { id: "kpi-checkin", kind: "kpi", shortLabel: "准备完成率", value: "93.6%" },
    { id: "chart-major", kind: "major", shortLabel: "专业构成", value: "STUDENTS" },
    { id: "chart-region", kind: "region", shortLabel: "地区与专业大类", value: "STUDENTS" },
    { id: "legend-region", kind: "legend", shortLabel: "地区图例", value: "LEGEND" },
    { id: "chart-progress", kind: "progress", shortLabel: "入学准备完成度", value: "PERCENT" },
    { id: "dashboard-note", kind: "annotation", shortLabel: "Dashboard 说明", value: "READING NOTE" },
  ];
  const moduleIds = moduleSpecs.map((item) => item.id);
  const metadataFallback = {
    "dashboard-header": { label: "Dashboard 标题", role: "context", group: "overview", importance: 6 },
    filters: { label: "筛选器", role: "control", group: "control", importance: 4 },
    "kpi-total": { label: "新生总数", role: "primary-kpi", group: "overview", importance: 8 },
    "kpi-major": { label: "专业数量", role: "supporting-kpi", group: "overview", importance: 5 },
    "kpi-region": { label: "生源区域数量", role: "supporting-kpi", group: "overview", importance: 5 },
    "kpi-checkin": { label: "准备完成率", role: "supporting-kpi", group: "overview", importance: 6 },
    "chart-major": { label: "专业构成", role: "primary-visualization", group: "major-analysis", importance: 9 },
    "chart-region": { label: "地区与专业大类", role: "primary-visualization", group: "region-analysis", importance: 8 },
    "legend-region": { label: "地区图例", role: "legend", group: "region-analysis", importance: 3 },
    "chart-progress": { label: "入学准备完成度", role: "supporting-visualization", group: "progress-analysis", importance: 6 },
    "dashboard-note": { label: "Dashboard 说明", role: "annotation", group: "overview", importance: 3 },
  };
  const moduleById = new Map(moduleSpecs.map((spec) => {
    const metadata = (window.dashboardModules || []).find((item) => item.id === spec.id) || metadataFallback[spec.id];
    return [spec.id, { ...spec, ...metadata, label: metadata.label || spec.shortLabel }];
  }));
  const viewportValues = { wide: 1280, medium: 900, narrow: 390 };
  const viewportLabels = { wide: "WIDE", medium: "MEDIUM", narrow: "NARROW" };
  const state = { step: 0, viewport: "wide", view: "before" };
  const surgeryStates = {
    initial: {
      label: "INITIAL",
      principle: "先观察真实的空间结构。",
      change: "保留初始 Dashboard，不修改任何模块。",
      reason: "图表没有明显错误，但页面关系仍然混乱。",
    },
    diagnose: {
      label: "DIAGNOSE",
      principle: "先看见问题，再决定修改。",
      change: "位置保持不变，只标出面积、分组与阅读路径问题。",
      reason: "诊断需要建立在真实模块边界和空间距离上。",
    },
    prioritize: {
      label: "PRIORITIZE",
      principle: "重要信息获得更合适的视觉权重。",
      change: "专业构成扩大，次要模块相对弱化，KPI 保留 overview。",
      reason: "专业构成 Importance 较高，但初始布局中的视觉显著性不足。",
    },
    group: {
      label: "GROUP",
      principle: "把语义关系映射为空间关系。",
      change: "KPI、专业、地区、完成度与控制区形成更清楚的邻近关系。",
      reason: "相关模块靠近后，用户更容易沿着同一信息关系继续阅读。",
    },
    allocate: {
      label: "ALLOCATE",
      principle: "在有限页面空间中建立合理比例。",
      change: "专业构成成为主要区域，Heatmap 与 legend 保持完整可读。",
      reason: "空间预算需要综合 importance、模块类型和最低可读尺寸。",
    },
    adapt: {
      label: "ADAPT",
      principle: "让结构适应空间，而不是缩小一切。",
      change: "同一重构布局在 Wide、Medium、Narrow 间改变列数与阅读流。",
      reason: "响应式验证的是核心关系能否在不同可用宽度下成立。",
    },
    final: {
      label: "FINAL",
      principle: "让层级、分组、空间与响应共同工作。",
      change: "回到 Wide，隐藏诊断辅助，只保留一种更清晰的布局方案。",
      reason: "布局是相互约束的设计决策，不是自动产生的唯一最优答案。",
    },
  };
  const stepOrder = ["initial", "diagnose", "prioritize", "group", "allocate", "adapt", "final"];

  let svg = null;
  let renderFrame = null;
  let initialLayout = null;
  let initialized = false;
  let currentLayout = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function put(items, id, x, y, width, height) {
    items[id] = { ...moduleById.get(id), x, y, width: Math.max(1, width), height: Math.max(1, height) };
  }

  function createBaseLayout(height) {
    const items = {};
    const left = 54;
    const contentWidth = CANVAS_WIDTH - left * 2;
    put(items, "dashboard-header", left, 28, contentWidth, 68);
    put(items, "filters", left, 116, contentWidth, 54);
    return { items, width: CANVAS_WIDTH, height };
  }

  function addKpis(items, y, height, columns, gap = 18) {
    const left = 54;
    const contentWidth = CANVAS_WIDTH - left * 2;
    const width = (contentWidth - gap * (columns - 1)) / columns;
    ["kpi-total", "kpi-major", "kpi-region", "kpi-checkin"].forEach((id, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      put(items, id, left + column * (width + gap), y + row * (height + gap), width, height);
    });
  }

  function makeWideLayout(majorRatio = 0.58) {
    const layout = createBaseLayout(720);
    const left = 54;
    const contentWidth = CANVAS_WIDTH - left * 2;
    const gap = 20;
    addKpis(layout.items, 192, 72, 4);
    const analysisY = 292;
    const analysisHeight = 218;
    const majorWidth = (contentWidth - gap) * majorRatio;
    put(layout.items, "chart-major", left, analysisY, majorWidth, analysisHeight);
    put(layout.items, "chart-progress", left + majorWidth + gap, analysisY, contentWidth - majorWidth - gap, analysisHeight);
    const lowerY = 532;
    const legendWidth = 182;
    const regionWidth = contentWidth - legendWidth - gap;
    put(layout.items, "chart-region", left, lowerY, regionWidth, 126);
    put(layout.items, "legend-region", left + regionWidth + gap, lowerY + 20, legendWidth, 86);
    put(layout.items, "dashboard-note", left, 676, contentWidth, 28);
    return layout;
  }

  function makeMediumLayout() {
    const layout = createBaseLayout(930);
    const left = 54;
    const contentWidth = CANVAS_WIDTH - left * 2;
    const gap = 18;
    addKpis(layout.items, 192, 68, 2, gap);
    put(layout.items, "chart-major", left, 370, contentWidth, 196);
    put(layout.items, "chart-progress", left, 582, contentWidth, 176);
    const legendWidth = 212;
    const regionWidth = contentWidth - legendWidth - gap;
    put(layout.items, "chart-region", left, 774, regionWidth, 112);
    put(layout.items, "legend-region", left + regionWidth + gap, 794, legendWidth, 80);
    put(layout.items, "dashboard-note", left, 898, contentWidth, 24);
    return layout;
  }

  function makeNarrowLayout() {
    const layout = createBaseLayout(1300);
    const left = 54;
    const contentWidth = CANVAS_WIDTH - left * 2;
    addKpis(layout.items, 190, 68, 1, 12);
    put(layout.items, "chart-major", left, 526, contentWidth, 188);
    put(layout.items, "chart-progress", left, 730, contentWidth, 170);
    put(layout.items, "chart-region", left, 916, contentWidth, 190);
    put(layout.items, "legend-region", left, 1118, contentWidth, 64);
    put(layout.items, "dashboard-note", left, 1194, contentWidth, 60);
    return layout;
  }

  function buildInitialLayout() {
    const dashboard = document.querySelector(".dashboard-shell");
    if (!dashboard) return null;
    const dashboardRect = dashboard.getBoundingClientRect();
    if (!dashboardRect.width) return null;
    const nodes = moduleIds
      .map((id) => dashboard.querySelector(`[data-module-id="${id}"]`))
      .filter(Boolean);
    if (nodes.length !== moduleIds.length) return null;
    const measurements = nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { id: node.dataset.moduleId, x: rect.left - dashboardRect.left, y: rect.top - dashboardRect.top, width: rect.width, height: rect.height };
    });
    if (measurements.some((item) => item.width <= 0 || item.height <= 0)) return null;
    const sourceHeight = Math.max(dashboardRect.height, ...measurements.map((item) => item.y + item.height));
    const layout = { width: CANVAS_WIDTH, height: 760, items: {} };
    measurements.forEach((item) => {
      put(layout.items, item.id, (item.x / dashboardRect.width) * CANVAS_WIDTH, (item.y / sourceHeight) * layout.height, (item.width / dashboardRect.width) * CANVAS_WIDTH, (item.height / sourceHeight) * layout.height);
    });
    return layout;
  }

  function getResponsiveMode(viewport) {
    const responsive = window.responsiveLab?.computeLayout?.(viewport);
    if (responsive?.mode?.id) return responsive.mode.id;
    if (viewport >= 1100) return "wide";
    if (viewport >= 760) return "medium";
    return "narrow";
  }

  function buildAdaptLayout(viewport = state.viewport) {
    const mode = getResponsiveMode(viewportValues[viewport]);
    const layout = mode === "wide" ? makeWideLayout(0.58) : mode === "medium" ? makeMediumLayout() : makeNarrowLayout();
    layout.mode = mode;
    return layout;
  }

  function getLayoutForStep(step = state.step, viewport = state.viewport) {
    const stepId = stepOrder[step];
    if (stepId === "initial" || stepId === "diagnose") return initialLayout;
    if (stepId === "prioritize") return makeWideLayout(0.66);
    if (stepId === "group") return makeWideLayout(0.52);
    if (stepId === "allocate") return makeWideLayout(0.56);
    if (stepId === "adapt") return buildAdaptLayout(viewport);
    return makeWideLayout(0.62);
  }

  function appendGlyph(group, data) {
    const glyph = group.append("g").attr("class", "surgery-glyph");
    if (data.kind === "header") {
      glyph.append("rect").attr("class", "surgery-glyph-line surgery-glyph-line--wide");
      glyph.append("rect").attr("class", "surgery-glyph-line surgery-glyph-line--short");
    } else if (data.kind === "filters") {
      glyph.append("rect").attr("class", "surgery-filter-field surgery-filter-field--first");
      glyph.append("rect").attr("class", "surgery-filter-field surgery-filter-field--second");
    } else if (data.kind === "kpi") {
      glyph.append("text").attr("class", "surgery-kpi-value");
      glyph.append("line").attr("class", "surgery-kpi-rule");
    } else if (data.kind === "major") {
      glyph.selectAll("rect").data([0, 1, 2]).join("rect").attr("class", "surgery-major-glyph");
    } else if (data.kind === "region") {
      glyph.selectAll("rect").data(d3Api.range(12)).join("rect").attr("class", "surgery-region-cell");
    } else if (data.kind === "legend") {
      glyph.selectAll("rect").data(d3Api.range(5)).join("rect").attr("class", "surgery-legend-segment");
    } else if (data.kind === "progress") {
      glyph.append("line").attr("class", "surgery-progress-line");
      glyph.selectAll("circle").data(d3Api.range(4)).join("circle").attr("class", "surgery-progress-dot");
    } else if (data.kind === "annotation") {
      glyph.selectAll("line").data([0, 1]).join("line").attr("class", "surgery-note-line");
    }
  }

  function updateGlyph(group, data) {
    const width = data.width;
    const height = data.height;
    const glyph = group.select(".surgery-glyph");
    const x = 12;
    const y = data.kind === "kpi" ? Math.min(height - 16, 42) : 42;
    const glyphWidth = Math.max(24, width - 24);
    const glyphHeight = Math.max(22, height - 54);
    if (data.kind === "header") {
      glyph.select(".surgery-glyph-line--wide").attr("x", x).attr("y", height - 30).attr("width", Math.max(24, width * 0.42)).attr("height", 5);
      glyph.select(".surgery-glyph-line--short").attr("x", x).attr("y", height - 17).attr("width", Math.max(24, width * 0.24)).attr("height", 3);
    } else if (data.kind === "filters") {
      const fieldGap = 12;
      const fieldWidth = Math.max(32, (glyphWidth - fieldGap) / 2);
      glyph.select(".surgery-filter-field--first").attr("x", x).attr("y", y - 12).attr("width", fieldWidth).attr("height", 22);
      glyph.select(".surgery-filter-field--second").attr("x", x + fieldWidth + fieldGap).attr("y", y - 12).attr("width", fieldWidth).attr("height", 22);
    } else if (data.kind === "kpi") {
      glyph.select(".surgery-kpi-value").attr("x", x).attr("y", y).text(data.value);
      glyph.select(".surgery-kpi-rule").attr("x1", x).attr("x2", Math.max(x + 24, width - 12)).attr("y1", Math.min(height - 14, y + 20)).attr("y2", Math.min(height - 14, y + 20));
    } else if (data.kind === "major") {
      const blocks = [
        { x: 0, y: 0, width: 0.58, height: 0.52 },
        { x: 0.63, y: 0, width: 0.37, height: 0.72 },
        { x: 0, y: 0.59, width: 0.58, height: 0.41 },
      ];
      glyph.selectAll(".surgery-major-glyph").data(blocks).attr("x", (item) => x + item.x * glyphWidth).attr("y", (item) => y + item.y * glyphHeight).attr("width", (item) => Math.max(8, item.width * glyphWidth - 5)).attr("height", (item) => Math.max(8, item.height * glyphHeight - 5));
    } else if (data.kind === "region") {
      const cellWidth = glyphWidth / 4;
      const cellHeight = glyphHeight / 3;
      glyph.selectAll(".surgery-region-cell").attr("x", (item) => x + (item % 4) * cellWidth).attr("y", (item) => y + Math.floor(item / 4) * cellHeight).attr("width", Math.max(4, cellWidth - 4)).attr("height", Math.max(4, cellHeight - 4));
    } else if (data.kind === "legend") {
      const segmentWidth = glyphWidth / 5;
      glyph.selectAll(".surgery-legend-segment").attr("x", (item) => x + item * segmentWidth).attr("y", y).attr("width", Math.max(4, segmentWidth - 3)).attr("height", 14);
    } else if (data.kind === "progress") {
      const lineY = y + glyphHeight * 0.52;
      glyph.select(".surgery-progress-line").attr("x1", x).attr("x2", width - 12).attr("y1", lineY).attr("y2", lineY);
      glyph.selectAll(".surgery-progress-dot").attr("cx", (item) => x + item * ((glyphWidth - 8) / 3) + 4).attr("cy", (item) => lineY - [0, 8, -5, 11][item]).attr("r", 5);
    } else if (data.kind === "annotation") {
      glyph.selectAll(".surgery-note-line").attr("x1", x).attr("x2", Math.max(x + 24, width - 14)).attr("y1", (item) => y + item * 14).attr("y2", (item) => y + item * 14);
    }
  }

  function renderGroupLabels(layout, displayScale, step = state.step) {
    const stepId = stepOrder[step];
    const visible = ["group", "allocate", "adapt"].includes(stepId);
    const groupData = [
      { id: "overview", label: "OVERVIEW", target: "kpi-total" },
      { id: "major", label: "MAJOR", target: "chart-major" },
      { id: "progress", label: "PROGRESS", target: "chart-progress" },
      { id: "region", label: "REGION", target: "chart-region" },
    ].map((item) => ({ ...item, x: layout.items[item.target]?.x || 0, y: Math.max(13, (layout.items[item.target]?.y || 20) - 9) }));
    const labels = svg.select(".surgery-group-labels").selectAll("text.surgery-group-label").data(groupData, (item) => item.id).join("text").attr("class", "surgery-group-label");
    labels.classed("is-visible", visible).attr("x", (item) => item.x).attr("y", (item) => item.y).attr("font-size", 9 / displayScale).text((item) => item.label);
  }

  function renderDiagnostics(layout, displayScale, step = state.step) {
    const visible = stepOrder[step] === "diagnose";
    const items = layout.items;
    const diagnosticData = [
      { id: "major-gap", target: "chart-major", text: "重要内容面积偏小", direction: "top" },
      { id: "region-legend", target: "legend-region", text: "与 Heatmap 分组较弱", direction: "top" },
      { id: "reading-path", target: "dashboard-note", text: "阅读路径不够明确", direction: "bottom" },
    ].map((item) => {
      const target = items[item.target];
      if (!target) return { ...item, x1: 0, y1: 0, x2: 0, y2: 0, labelX: 0, labelY: 0 };
      const centerX = target.x + target.width / 2;
      if (item.direction === "bottom") return { ...item, x1: centerX, y1: target.y + target.height, x2: centerX, y2: target.y + target.height + 20, labelX: centerX, labelY: target.y + target.height + 34 };
      return { ...item, x1: centerX, y1: target.y, x2: centerX, y2: Math.max(10, target.y - 20), labelX: centerX, labelY: Math.max(10, target.y - 28) };
    });
    const lines = svg.select(".surgery-diagnostics").selectAll("line.surgery-diagnostic-line").data(diagnosticData, (item) => item.id).join("line").attr("class", "surgery-diagnostic-line");
    lines.classed("is-visible", visible).attr("x1", (item) => item.x1).attr("y1", (item) => item.y1).attr("x2", (item) => item.x2).attr("y2", (item) => item.y2);
    const labels = svg.select(".surgery-diagnostics").selectAll("text.surgery-diagnostic-label").data(diagnosticData, (item) => item.id).join("text").attr("class", "surgery-diagnostic-label");
    labels.classed("is-visible", visible).attr("x", (item) => item.labelX).attr("y", (item) => item.labelY).attr("font-size", 10 / displayScale).attr("text-anchor", "middle").text((item) => item.text);
  }

  function updateNarrative(step = state.step, viewport = state.viewport) {
    const stepId = stepOrder[step];
    const copy = surgeryStates[stepId];
    stepKicker.textContent = `STEP ${String(step + 1).padStart(2, "0")}`;
    narrativeTitle.textContent = copy.label;
    stageStatus.textContent = step === 5 ? `${copy.label} · ${viewportLabels[getResponsiveMode(viewportValues[viewport])]}` : copy.label;
    principle.textContent = copy.principle;
    change.textContent = copy.change;
    reason.textContent = copy.reason;
    const notes = {
      initial: "Initial uses the measured layout of the real Dashboard above.",
      diagnose: "The layout stays in place; only three lightweight observations are added.",
      prioritize: "A teaching target: visual weight follows hierarchy without treating importance as an automatic answer.",
      group: "Light group labels make semantic proximity visible without rebuilding the Dashboard.",
      allocate: "Main / Supporting ratios express a design decision, not an optimization score.",
      adapt: `The reconstructed layout is checked at ${viewportValues[viewport]}px using the same ${viewportLabels[getResponsiveMode(viewportValues[viewport])]} topology logic as Step 7.`,
      final: "Final returns to the default Wide view and removes diagnostic scaffolding.",
    };
    canvasNote.textContent = notes[stepId];
    viewportControls.hidden = step !== 5;
    summary.hidden = step !== 6;
    stage.classList.toggle("is-final", step === 6);
    stage.classList.toggle("is-diagnosing", step === 1);
    stage.classList.toggle("is-adapting", step === 5);
    stage.setAttribute("data-surgery-step", stepId);
    stepButtons.forEach((button) => {
      const active = Number(button.dataset.surgeryStep) === step;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    viewButtons.forEach((button) => {
      const active = (button.dataset.surgeryView === "before" && step === 0) || (button.dataset.surgeryView === "after" && step === 6);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    viewportButtons.forEach((button) => {
      const active = button.dataset.surgeryViewport === viewport;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    previousButton.disabled = step === 0;
    nextButton.disabled = step === stepOrder.length - 1;
  }

  function render(animate = true) {
    const renderStep = state.step;
    const renderViewport = state.viewport;
    const layout = getLayoutForStep(renderStep, renderViewport);
    if (!layout) return;
    const displayWidth = Math.max(1, canvas.getBoundingClientRect().width);
    const displayScale = displayWidth / layout.width;
    if (!svg) {
      canvas.replaceChildren();
      svg = d3Api.select(canvas).append("svg").attr("class", "surgery-svg").attr("role", "img").attr("aria-label", "Layout Surgery Dashboard model");
      svg.append("title").text("Layout Surgery");
      svg.append("desc").text("One Dashboard layout moves through diagnosis, prioritization, grouping, allocation, adaptation, and final presentation.");
      svg.append("g").attr("class", "surgery-modules");
      svg.append("g").attr("class", "surgery-group-labels");
      svg.append("g").attr("class", "surgery-diagnostics");
    }
    svg.attr("viewBox", `0 0 ${layout.width} ${layout.height}`);
    const duration = animate && currentLayout ? 600 : 0;
    const transition = (selection) => {
      selection.interrupt();
      return duration ? selection.transition().duration(duration).ease(d3Api.easeCubicInOut) : selection;
    };
    const data = moduleIds.map((id) => layout.items[id]).filter(Boolean);
    const modules = svg.select(".surgery-modules").selectAll("g.surgery-module").data(data, (item) => item.id).join((enter) => {
      const group = enter.append("g").attr("class", "surgery-module");
      group.append("rect").attr("class", "surgery-module-surface");
      group.append("text").attr("class", "surgery-module-label");
      group.each(function (item) { appendGlyph(d3Api.select(this), item); });
      return group;
    });
    modules
      .attr("data-module-id", (item) => item.id)
      .attr("aria-label", (item) => `${item.label}，Layout Surgery module`)
      .attr("class", (item) => `surgery-module surgery-module--${item.kind}`);
    transition(modules).attr("transform", (item) => `translate(${item.x},${item.y})`);
    transition(modules.select(".surgery-module-surface")).attr("x", 0).attr("y", 0).attr("width", (item) => item.width).attr("height", (item) => item.height);
    modules.select(".surgery-module-label").attr("x", 12).attr("y", 23).attr("font-size", (item) => (item.kind === "header" ? 15 : item.kind === "kpi" ? 10 : 11) / displayScale).text((item) => item.shortLabel);
    modules.select(".surgery-kpi-value").attr("font-size", 14 / displayScale);
    modules.each(function (item) { updateGlyph(d3Api.select(this), item); });
    currentLayout = layout;
    renderGroupLabels(layout, displayScale, renderStep);
    renderDiagnostics(layout, displayScale, renderStep);
    updateNarrative(renderStep, renderViewport);
    if (renderStep !== state.step || renderViewport !== state.viewport) scheduleRender(true);
  }

  function scheduleRender(animate = true) {
    if (renderFrame) return;
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null;
      render(animate);
    });
  }

  function setStep(nextStep, animate = true) {
    const bounded = clamp(Number(nextStep), 0, stepOrder.length - 1);
    if (bounded === 6) state.viewport = "wide";
    state.step = bounded;
    state.view = bounded === 0 ? "before" : bounded === 6 ? "after" : "step";
    scheduleRender(animate);
  }

  function captureAndInitialize() {
    if (initialized) return true;
    initialLayout = buildInitialLayout();
    if (!initialLayout) return false;
    initialized = true;
    window.layoutSurgery = {
      getState: () => ({ step: state.step, stepId: stepOrder[state.step], viewport: state.viewport, initialized, height: currentLayout?.height || null }),
      getInitialLayout: () => initialLayout,
      getStates: () => surgeryStates,
    };
    render(false);
    return true;
  }

  stepButtons.forEach((button) => button.addEventListener("click", () => setStep(button.dataset.surgeryStep)));
  viewButtons.forEach((button) => button.addEventListener("click", () => setStep(button.dataset.surgeryView === "after" ? 6 : 0)));
  viewportButtons.forEach((button) => button.addEventListener("click", () => {
    state.viewport = button.dataset.surgeryViewport;
    scheduleRender(true);
  }));
  previousButton.addEventListener("click", () => setStep(state.step - 1));
  nextButton.addEventListener("click", () => setStep(state.step + 1));
  resetButton.addEventListener("click", () => {
    state.step = 0;
    state.viewport = "wide";
    state.view = "before";
    scheduleRender(true);
  });

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => scheduleRender(false));
    observer.observe(canvas);
  } else {
    window.addEventListener("resize", () => scheduleRender(false));
  }
  window.addEventListener("dashboard:ready", captureAndInitialize);
  captureAndInitialize();
  let attempts = 0;
  const waitForDashboard = () => {
    if (initialized || attempts > 60) return;
    attempts += 1;
    if (!captureAndInitialize()) window.setTimeout(waitForDashboard, 100);
  };
  waitForDashboard();
})();
