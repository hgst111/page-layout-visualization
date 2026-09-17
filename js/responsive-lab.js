(() => {
  const d3Api = window.d3;
  const mapHost = document.getElementById("responsive-viewport-map");
  const frame = document.getElementById("responsive-viewport-frame");
  const shell = document.querySelector(".responsive-viewport-shell");
  const slider = document.getElementById("responsive-width");
  const widthValue = document.getElementById("responsive-width-value");
  const availableWidth = document.getElementById("responsive-available-width");
  const frameWidth = document.getElementById("responsive-frame-width");
  const columns = document.getElementById("responsive-columns");
  const topology = document.getElementById("responsive-topology");
  const pageLength = document.getElementById("responsive-page-length");
  const transitionLabel = document.getElementById("responsive-transition");
  const layoutMode = document.getElementById("responsive-layout-mode");
  const insight = document.getElementById("responsive-insight");
  const readingOrder = document.getElementById("responsive-reading-order");
  const resetButton = document.getElementById("responsive-reset");
  const presetButtons = [...document.querySelectorAll("[data-responsive-preset]")];

  if (!d3Api || !mapHost || !frame || !shell || !slider || !widthValue || !availableWidth || !frameWidth || !columns || !topology || !pageLength || !transitionLabel || !layoutMode || !insight || !readingOrder || !resetButton) return;

  const thresholds = { narrow: 760, wide: 1100 };
  const presetValues = { wide: 1280, medium: 900, narrow: 390 };
  const typography = {
    wide: { pageTitle: 15, moduleTitle: 11, kpiLabel: 9.5, kpiValue: 14, order: 9 },
    medium: { pageTitle: 14.5, moduleTitle: 10.5, kpiLabel: 9.5, kpiValue: 13.5, order: 9 },
    narrow: { pageTitle: 14.5, moduleTitle: 10.5, kpiLabel: 9.5, kpiValue: 14, order: 9 },
  };
  const fallbackLabels = {
    "dashboard-header": "Dashboard 标题",
    filters: "筛选器",
    "kpi-total": "新生总数",
    "kpi-major": "专业数量",
    "kpi-region": "生源区域",
    "kpi-checkin": "准备完成率",
    "chart-major": "专业构成",
    "chart-region": "地区与专业大类",
    "legend-region": "地区图例",
    "chart-progress": "入学准备完成度",
    "dashboard-note": "Dashboard 说明",
  };
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
  const metadata = new Map((window.dashboardModules || []).map((module) => [module.id, module]));
  const modules = moduleSpecs.map((spec) => ({
    ...spec,
    label: metadata.get(spec.id)?.label || fallbackLabels[spec.id] || spec.id,
  }));
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const state = { width: 1200, readingOrder: false };

  let svg = null;
  let renderFrame = null;
  let pendingWidth = state.width;
  let pendingAnimate = false;
  let currentLayout = null;
  let previousMode = null;

  function clampWidth(value) {
    return Math.max(375, Math.min(1440, Number(value) || 1200));
  }

  function getMode(width) {
    if (width >= thresholds.wide) return { id: "wide", label: "WIDE", columns: "4", topology: "side-by-side" };
    if (width >= thresholds.narrow) return { id: "medium", label: "MEDIUM", columns: "2", topology: "stacked content" };
    return { id: "narrow", label: "NARROW", columns: "1", topology: "single-column flow" };
  }

  function addItem(items, id, x, y, width, height, order) {
    items[id] = {
      ...moduleById.get(id),
      x,
      y,
      width: Math.max(1, width),
      height: Math.max(1, height),
      order,
    };
    return order + 1;
  }

  function computeLayout(viewportWidth) {
    const width = clampWidth(viewportWidth);
    const mode = getMode(width);
    const items = {};
    const padding = mode.id === "wide" ? 28 : mode.id === "medium" ? 24 : 18;
    const gap = mode.id === "wide" ? 16 : 14;
    const contentWidth = Math.max(1, width - padding * 2);
    let y = padding;
    let order = 1;

    order = addItem(items, "dashboard-header", padding, y, contentWidth, mode.id === "narrow" ? 66 : 72, order);
    y += items["dashboard-header"].height + gap;
    order = addItem(items, "filters", padding, y, contentWidth, mode.id === "narrow" ? 70 : 60, order);
    y += items.filters.height + gap;

    if (mode.id === "wide") {
      const kpiWidth = (contentWidth - gap * 3) / 4;
      ["kpi-total", "kpi-major", "kpi-region", "kpi-checkin"].forEach((id, index) => {
        order = addItem(items, id, padding + index * (kpiWidth + gap), y, kpiWidth, 88, order);
      });
      y += 88 + gap;

      const chartWidth = (contentWidth - gap) / 2;
      order = addItem(items, "chart-major", padding, y, chartWidth, 224, order);
      order = addItem(items, "chart-progress", padding + chartWidth + gap, y, chartWidth, 224, order);
      y += 224 + gap;

      const legendWidth = Math.min(180, contentWidth * 0.22);
      const regionWidth = contentWidth - legendWidth - gap;
      order = addItem(items, "chart-region", padding, y, regionWidth, 236, order);
      order = addItem(items, "legend-region", padding + regionWidth + gap, y + 28, legendWidth, 180, order);
      y += 236 + gap;
      order = addItem(items, "dashboard-note", padding, y, contentWidth, 66, order);
      y += 66 + padding;
    } else if (mode.id === "medium") {
      const kpiWidth = (contentWidth - gap) / 2;
      ["kpi-total", "kpi-major", "kpi-region", "kpi-checkin"].forEach((id, index) => {
        const row = Math.floor(index / 2);
        const column = index % 2;
        order = addItem(items, id, padding + column * (kpiWidth + gap), y + row * (76 + gap), kpiWidth, 76, order);
      });
      y += 76 * 2 + gap;

      order = addItem(items, "chart-major", padding, y, contentWidth, 214, order);
      y += 214 + gap;
      order = addItem(items, "chart-progress", padding, y, contentWidth, 204, order);
      y += 204 + gap;

      const legendWidth = Math.min(170, contentWidth * 0.24);
      const regionWidth = contentWidth - legendWidth - gap;
      order = addItem(items, "chart-region", padding, y, regionWidth, 232, order);
      order = addItem(items, "legend-region", padding + regionWidth + gap, y + 28, legendWidth, 176, order);
      y += 232 + gap;
      order = addItem(items, "dashboard-note", padding, y, contentWidth, 66, order);
      y += 66 + padding;
    } else {
      const itemWidth = contentWidth;
      ["kpi-total", "kpi-major", "kpi-region", "kpi-checkin"].forEach((id) => {
        order = addItem(items, id, padding, y, itemWidth, 68, order);
        y += 68 + gap;
      });
      order = addItem(items, "chart-major", padding, y, itemWidth, 206, order);
      y += 206 + gap;
      order = addItem(items, "chart-progress", padding, y, itemWidth, 186, order);
      y += 186 + gap;
      order = addItem(items, "chart-region", padding, y, itemWidth, 224, order);
      y += 224 + gap;
      order = addItem(items, "legend-region", padding, y, itemWidth, 70, order);
      y += 70 + gap;
      order = addItem(items, "dashboard-note", padding, y, itemWidth, 76, order);
      y += 76 + padding;
    }

    return { width, height: y, mode, items };
  }

  const wideBaseHeight = computeLayout(1200).height;

  function updateControls(layout, transitionType) {
    const width = Math.round(layout.width);
    slider.value = String(width);
    widthValue.textContent = `${width} px`;
    availableWidth.textContent = `${width} px`;
    frameWidth.textContent = `${width} px`;
    columns.textContent = layout.mode.columns;
    topology.textContent = layout.mode.topology;
    pageLength.textContent = `${(layout.height / wideBaseHeight).toFixed(1)}×`;
    layoutMode.textContent = layout.mode.label;
    transitionLabel.textContent = `Current transition: ${transitionType}`;
    const matchingPreset = Object.entries(presetValues).find(([, value]) => value === width)?.[0] || null;
    presetButtons.forEach((button) => {
      const active = button.dataset.responsivePreset === matchingPreset;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const insightText = {
      wide: `At ${width}px, the overview keeps four columns and the analysis modules share a side-by-side row.`,
      medium: `At ${width}px, the overview becomes a 2 × 2 grid and the main visual modules stack vertically.`,
      narrow: `At ${width}px, the page becomes a single reading flow and uses more vertical space to preserve readable modules.`,
    };
    insight.textContent = insightText[layout.mode.id];
  }

  function displayWidth(logicalWidth) {
    const available = Math.max(1, shell.getBoundingClientRect().width);
    const normalized = (logicalWidth - 375) / (1440 - 375);
    const minimum = Math.min(320, available);
    return Math.min(available, Math.max(minimum, available * (0.68 + normalized * 0.32)));
  }

  function appendGlyph(group, data) {
    const glyph = group.append("g").attr("class", "responsive-glyph");
    if (data.kind === "header") {
      glyph.append("rect").attr("class", "responsive-glyph-line responsive-glyph-line--wide");
      glyph.append("rect").attr("class", "responsive-glyph-line responsive-glyph-line--short");
    } else if (data.kind === "filters") {
      glyph.append("rect").attr("class", "responsive-filter-field responsive-filter-field--first");
      glyph.append("rect").attr("class", "responsive-filter-field responsive-filter-field--second");
    } else if (data.kind === "kpi") {
      glyph.append("text").attr("class", "responsive-kpi-value");
      glyph.append("line").attr("class", "responsive-kpi-rule");
    } else if (data.kind === "major") {
      glyph.selectAll("rect").data([0, 1, 2]).join("rect").attr("class", "responsive-major-glyph");
    } else if (data.kind === "region") {
      glyph.selectAll("rect").data(d3Api.range(12)).join("rect").attr("class", "responsive-region-cell");
    } else if (data.kind === "legend") {
      glyph.selectAll("rect").data(d3Api.range(5)).join("rect").attr("class", "responsive-legend-segment");
    } else if (data.kind === "progress") {
      glyph.append("line").attr("class", "responsive-progress-line");
      glyph.selectAll("circle").data(d3Api.range(4)).join("circle").attr("class", "responsive-progress-dot");
    } else if (data.kind === "annotation") {
      glyph.selectAll("line").data([0, 1]).join("line").attr("class", "responsive-note-line");
    }
  }

  function updateGlyph(group, data) {
    const width = data.width;
    const height = data.height;
    const glyph = group.select(".responsive-glyph");
    const x = 10;
    const y = data.kind === "kpi" ? 34 : 36;
    const availableGlyphWidth = Math.max(20, width - 20);
    const availableGlyphHeight = Math.max(20, height - 46);

    if (data.kind === "header") {
      glyph.select(".responsive-glyph-line--wide").attr("x", x).attr("y", height - 27).attr("width", Math.max(20, width * 0.42)).attr("height", 4);
      glyph.select(".responsive-glyph-line--short").attr("x", x).attr("y", height - 16).attr("width", Math.max(20, width * 0.24)).attr("height", 3);
    } else if (data.kind === "filters") {
      const fieldGap = 10;
      const fieldWidth = Math.max(30, (availableGlyphWidth - fieldGap) / 2);
      glyph.select(".responsive-filter-field--first").attr("x", x).attr("y", y - 10).attr("width", fieldWidth).attr("height", 18);
      glyph.select(".responsive-filter-field--second").attr("x", x + fieldWidth + fieldGap).attr("y", y - 10).attr("width", fieldWidth).attr("height", 18);
    } else if (data.kind === "kpi") {
      glyph.select(".responsive-kpi-value").attr("x", x).attr("y", y).text(data.value);
      glyph.select(".responsive-kpi-rule").attr("x1", x).attr("x2", Math.max(x + 20, width - 10)).attr("y1", Math.min(height - 12, y + 17)).attr("y2", Math.min(height - 12, y + 17));
    } else if (data.kind === "major") {
      const blocks = [
        { x: 0, y: 0, width: 0.58, height: 0.52 },
        { x: 0.63, y: 0, width: 0.37, height: 0.72 },
        { x: 0, y: 0.59, width: 0.58, height: 0.41 },
      ];
      glyph.selectAll(".responsive-major-glyph").data(blocks).attr("x", (item) => x + item.x * availableGlyphWidth).attr("y", (item) => y + item.y * availableGlyphHeight).attr("width", (item) => Math.max(6, item.width * availableGlyphWidth - 4)).attr("height", (item) => Math.max(6, item.height * availableGlyphHeight - 4));
    } else if (data.kind === "region") {
      const cellWidth = availableGlyphWidth / 4;
      const cellHeight = availableGlyphHeight / 3;
      glyph.selectAll(".responsive-region-cell").attr("x", (item) => x + (item % 4) * cellWidth).attr("y", (item) => y + Math.floor(item / 4) * cellHeight).attr("width", Math.max(3, cellWidth - 3)).attr("height", Math.max(3, cellHeight - 3));
    } else if (data.kind === "legend") {
      const segmentWidth = availableGlyphWidth / 5;
      glyph.selectAll(".responsive-legend-segment").attr("x", (item) => x + item * segmentWidth).attr("y", y).attr("width", Math.max(3, segmentWidth - 2)).attr("height", 12);
    } else if (data.kind === "progress") {
      const lineY = y + availableGlyphHeight * 0.52;
      glyph.select(".responsive-progress-line").attr("x1", x).attr("x2", width - 10).attr("y1", lineY).attr("y2", lineY);
      glyph.selectAll(".responsive-progress-dot").attr("cx", (item) => x + item * ((availableGlyphWidth - 8) / 3) + 4).attr("cy", (item) => lineY - [0, 7, -4, 10][item]).attr("r", 4);
    } else if (data.kind === "annotation") {
      glyph.selectAll(".responsive-note-line").attr("x1", x).attr("x2", Math.max(x + 20, width - 12)).attr("y1", (item) => y + item * 12).attr("y2", (item) => y + item * 12);
    }
  }

  function render(layout, animate, transitionType) {
    const display = displayWidth(layout.width);
    const type = typography[layout.mode.id];
    const displayScale = display / layout.width;
    const toViewBoxFontSize = (screenPixels) => screenPixels / displayScale;
    frame.style.width = `${display}px`;
    if (!svg) {
      mapHost.replaceChildren();
      svg = d3Api.select(mapHost).append("svg").attr("class", "responsive-svg").attr("role", "img").attr("aria-label", "Responsive Dashboard layout model");
      svg.append("title").text("Responsive Dashboard Model");
      svg.append("desc").text("A single module collection reorganizes across wide, medium, and narrow teaching thresholds.");
      svg.append("g").attr("class", "responsive-modules");
    }
    svg.attr("viewBox", `0 0 ${layout.width} ${layout.height}`);

    const data = Object.values(layout.items);
    const duration = animate ? (transitionType === "REFLOW" ? 360 : 90) : 0;
    const transition = (selection) => {
      selection.interrupt();
      return duration ? selection.transition().duration(duration).ease(d3Api.easeCubicInOut) : selection;
    };
    const modulesSelection = svg
      .select(".responsive-modules")
      .selectAll("g.responsive-module")
      .data(data, (item) => item.id)
      .join((enter) => {
        const group = enter.append("g").attr("class", "responsive-module");
        group.append("rect").attr("class", "responsive-module-surface");
        group.append("text").attr("class", "responsive-module-label");
        group.append("text").attr("class", "responsive-order");
        group.each(function (item) {
          appendGlyph(d3Api.select(this), item);
        });
        return group;
      });

    modulesSelection
      .attr("data-adapt-module-id", (item) => item.id)
      .attr("aria-label", (item) => `${item.label}，${layout.mode.label} layout module`)
      .attr("class", (item) => `responsive-module responsive-module--${item.kind}`);
    transition(modulesSelection).attr("transform", (item) => `translate(${item.x},${item.y})`);
    transition(modulesSelection.select(".responsive-module-surface"))
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (item) => item.width)
      .attr("height", (item) => item.height);
    modulesSelection
      .select(".responsive-module-label")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", (item) => toViewBoxFontSize(item.kind === "header" ? type.pageTitle : item.kind === "kpi" ? type.kpiLabel : type.moduleTitle))
      .text((item) => item.shortLabel);
    modulesSelection
      .select(".responsive-order")
      .classed("is-hidden", !state.readingOrder)
      .attr("x", (item) => item.width - 16)
      .attr("y", 18)
      .attr("font-size", toViewBoxFontSize(type.order))
      .text((item) => item.order);
    modulesSelection.select(".responsive-kpi-value").attr("font-size", toViewBoxFontSize(type.kpiValue));
    modulesSelection.each(function (item) {
      updateGlyph(d3Api.select(this), item);
    });

    currentLayout = layout;
    updateControls(layout, transitionType);
  }

  function scheduleRender(animate = true) {
    pendingWidth = state.width;
    pendingAnimate = pendingAnimate || animate;
    if (renderFrame) return;
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null;
      const layout = computeLayout(pendingWidth);
      const transitionType = previousMode && previousMode !== layout.mode.id ? "REFLOW" : "RESIZE";
      const shouldAnimate = pendingAnimate && Boolean(currentLayout);
      pendingAnimate = false;
      previousMode = layout.mode.id;
      render(layout, shouldAnimate, transitionType);
    });
  }

  slider.addEventListener("input", (event) => {
    state.width = clampWidth(event.target.value);
    scheduleRender(true);
  });
  readingOrder.addEventListener("change", (event) => {
    state.readingOrder = event.target.checked;
    scheduleRender(false);
  });
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.width = presetValues[button.dataset.responsivePreset];
      scheduleRender(true);
    });
  });
  resetButton.addEventListener("click", () => {
    state.width = 1200;
    state.readingOrder = false;
    readingOrder.checked = false;
    scheduleRender(true);
  });

  window.responsiveLab = {
    computeLayout,
    getState: () => ({ width: state.width, mode: currentLayout?.mode.id || null, readingOrder: state.readingOrder, height: currentLayout?.height || null }),
  };

  if (window.ResizeObserver) {
    let observedShellWidth = shell.getBoundingClientRect().width;
    const observer = new ResizeObserver((entries) => {
      const nextShellWidth = entries[0]?.contentRect?.width ?? shell.getBoundingClientRect().width;
      if (Math.abs(nextShellWidth - observedShellWidth) < 0.5) return;
      observedShellWidth = nextShellWidth;
      scheduleRender(false);
    });
    observer.observe(shell);
  } else {
    window.addEventListener("resize", () => scheduleRender(false));
  }
  scheduleRender(false);
})();
