(() => {
  const d3Api = window.d3;
  const mapHost = document.getElementById("importance-map");
  const minimapHost = document.getElementById("layout-minimap");
  const detail = document.getElementById("hierarchy-detail");
  const ranking = document.getElementById("mismatch-ranking");
  const resetButton = document.getElementById("hierarchy-reset");
  const dashboard = document.querySelector(".dashboard-shell");

  if (!d3Api || !mapHost || !minimapHost || !detail || !ranking || !resetButton || !dashboard) return;

  const analysisIds = [
    "kpi-total",
    "kpi-major",
    "kpi-region",
    "kpi-checkin",
    "chart-major",
    "chart-region",
    "chart-progress",
    "legend-region",
    "dashboard-note",
  ];

  const analysisModules = (window.dashboardModules || []).filter((module) => analysisIds.includes(module.id));
  window.hierarchyAnalysisModules = analysisModules;

  const state = {
    selectedId: null,
    previewId: null,
  };

  const colors = {
    kpi: "#5c7198",
    visualization: "#6d8279",
    annotation: "#8a7891",
  };

  let analysisData = [];
  let layoutMeasurements = [];
  let resizeFrame = null;
  let dashboardReady = false;

  const tooltip = d3Api
    .select("#dashboard-tooltip")
    .attr("role", "tooltip");

  function getModuleKind(module) {
    if (module.role && module.role.includes("kpi")) return "kpi";
    if (module.role && module.role.includes("visualization")) return "visualization";
    return "annotation";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatGap(value) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
  }

  function getInterpretation(gap) {
    if (gap < -1) return "突出不足";
    if (gap > 1) return "过度突出";
    return "基本匹配";
  }

  function measureDashboard() {
    if (window.dashboardLayout?.measureLayout) window.dashboardLayout.measureLayout();
    layoutMeasurements = window.dashboardLayout?.getMeasurements?.() || [];
  }

  function computeProminence() {
    const layoutHeight = Math.max(1, dashboard.getBoundingClientRect().height);
    const measured = new Map(layoutMeasurements.map((item) => [item.id, item]));
    const records = analysisModules
      .map((module) => {
        const layout = measured.get(module.id);
        if (!layout) return null;
        return { module, layout, areaValue: Math.sqrt(layout.width * layout.height) };
      })
      .filter(Boolean);

    const minArea = d3Api.min(records, (item) => item.areaValue) || 0;
    const maxArea = d3Api.max(records, (item) => item.areaValue) || 1;
    const areaRange = Math.max(1, maxArea - minArea);

    analysisData = records.map(({ module, layout, areaValue }) => {
      const areaScore = (areaValue - minArea) / areaRange;
      const positionScore = clamp(1 - layout.y / layoutHeight, 0, 1);
      const prominence = 1 + 9 * (0.65 * areaScore + 0.35 * positionScore);
      const gap = prominence - module.importance;
      return {
        ...module,
        ...layout,
        kind: getModuleKind(module),
        areaScore,
        positionScore,
        prominence,
        gap,
        interpretation: getInterpretation(gap),
      };
    });
  }

  function showTooltip(event, item) {
    if (!tooltip?.node()) return;
    const analysisItem = analysisData.find((candidate) => candidate.id === item.id);
    if (!analysisItem) {
      tooltip
        .attr("hidden", null)
        .html(`<strong>${item.label}</strong><span>Context module</span><span>Layout position：${Math.round(item.x)}, ${Math.round(item.y)} px</span><span>Size：${Math.round(item.width)} × ${Math.round(item.height)} px</span>`);
      const contextNode = tooltip.node();
      const contextLeft = Math.min(event.clientX + 14, window.innerWidth - contextNode.offsetWidth - 12);
      const contextTop = Math.min(event.clientY + 14, window.innerHeight - contextNode.offsetHeight - 12);
      tooltip.style("left", `${Math.max(12, contextLeft)}px`).style("top", `${Math.max(12, contextTop)}px`);
      return;
    }
    tooltip
      .attr("hidden", null)
      .html(`<strong>${analysisItem.label}</strong><span>Importance：${analysisItem.importance} / 10</span><span>Prominence：${analysisItem.prominence.toFixed(1)} / 10</span><span>Gap：${formatGap(analysisItem.gap)}</span><span>Interpretation：${analysisItem.interpretation}</span><span>Area：${Math.round(analysisItem.width)} × ${Math.round(analysisItem.height)} px</span><span>Vertical position：${Math.round(analysisItem.y)} px</span>`);
    const node = tooltip.node();
    const left = Math.min(event.clientX + 14, window.innerWidth - node.offsetWidth - 12);
    const top = Math.min(event.clientY + 14, window.innerHeight - node.offsetHeight - 12);
    tooltip.style("left", `${Math.max(12, left)}px`).style("top", `${Math.max(12, top)}px`);
  }

  function hideTooltip() {
    tooltip.attr("hidden", true);
  }

  function getActiveId() {
    return state.previewId || state.selectedId;
  }

  function setLinkedHighlight(id) {
    document.querySelectorAll("[data-module-id].is-linked-highlight").forEach((node) => node.classList.remove("is-linked-highlight"));
    if (!id) return;
    document.querySelector(`[data-module-id="${id}"]`)?.classList.add("is-linked-highlight");
  }

  function updateDetail() {
    const activeId = getActiveId();
    const item = analysisData.find((module) => module.id === activeId);
    const contextLayout = layoutMeasurements.find((module) => module.id === activeId);
    const paragraph = detail.querySelector("p");
    if (!paragraph) return;
    detail.classList.toggle("has-selection", Boolean(item || contextLayout));
    if (!item && !contextLayout) {
      paragraph.textContent = "Hover a point or module to inspect its layout.";
      setLinkedHighlight(null);
      return;
    }
    if (item) {
      paragraph.textContent = `${item.label} · Importance ${item.importance}/10 · Prominence ${item.prominence.toFixed(1)}/10 · ${item.interpretation}`;
      setLinkedHighlight(item.id);
      return;
    }
    paragraph.textContent = `${contextLayout.label} · Context module · Position ${Math.round(contextLayout.x)}, ${Math.round(contextLayout.y)} · Size ${Math.round(contextLayout.width)} × ${Math.round(contextLayout.height)} px`;
    setLinkedHighlight(contextLayout.id);
  }

  function selectModule(id) {
    state.selectedId = state.selectedId === id ? null : id;
    state.previewId = null;
    updateSelection();
  }

  function previewModule(id) {
    state.previewId = id;
    updateSelection();
  }

  function clearPreview() {
    state.previewId = null;
    hideTooltip();
    updateSelection();
  }

  function updateSelection() {
    const activeId = getActiveId();
    d3Api.selectAll(".hierarchy-point").classed("is-active", (item) => item.id === activeId).classed("is-selected", (item) => item.id === state.selectedId);
    d3Api.selectAll(".minimap-module").classed("is-active", (item) => item.id === activeId).classed("is-selected", (item) => item.id === state.selectedId);
    d3Api.selectAll(".mismatch-item").classed("is-active", (item) => item.id === activeId).classed("is-selected", (item) => item.id === state.selectedId);
    updateDetail();
  }

  function bindInteractive(selection) {
    selection
      .on("pointerenter", (event, item) => {
        previewModule(item.id);
        showTooltip(event, item);
      })
      .on("pointermove", (event, item) => showTooltip(event, item))
      .on("pointerleave", clearPreview)
      .on("click", (event, item) => {
        event.stopPropagation();
        selectModule(item.id);
      });
  }

  function renderScatter() {
    const width = Math.floor(mapHost.getBoundingClientRect().width);
    if (!width) return;
    const height = Math.max(348, Math.min(490, width * 0.78));
    const margin = { top: 22, right: 22, bottom: 58, left: 58 };
    const x = d3Api.scaleLinear().domain([1, 10]).range([margin.left, width - margin.right]);
    const y = d3Api.scaleLinear().domain([1, 10]).range([height - margin.bottom, margin.top]);
    const values = d3Api.range(1, 10.01, 0.1).map((value) => ({ value }));

    mapHost.replaceChildren();
    const svg = d3Api
      .select(mapHost)
      .append("svg")
      .attr("class", "hierarchy-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Information Importance 与 Visual Prominence 散点图");
    svg.append("title").text("Importance–Prominence Map");

    const band = d3Api
      .area()
      .x((item) => x(item.value))
      .y0((item) => y(clamp(item.value + 1, 1, 10)))
      .y1((item) => y(clamp(item.value - 1, 1, 10)));

    svg.append("path").attr("class", "balanced-band").attr("d", band(values));
    svg.append("line").attr("class", "diagonal-reference").attr("x1", x(1)).attr("y1", y(1)).attr("x2", x(10)).attr("y2", y(10));
    svg.append("text").attr("class", "quadrant-label quadrant-label--over").attr("x", x(1.4)).attr("y", y(8.9)).text("Over-emphasized");
    svg.append("text").attr("class", "quadrant-label quadrant-label--under").attr("x", x(7.1)).attr("y", y(2)).text("Under-emphasized");
    svg.append("text").attr("class", "quadrant-label quadrant-label--balanced").attr("x", x(7.1)).attr("y", y(8.6)).text("Balanced");

    const gridTicks = [2, 4, 6, 8, 10];
    svg
      .selectAll("line.plot-grid")
      .data(gridTicks)
      .join("line")
      .attr("class", "plot-grid")
      .attr("x1", (value) => x(value))
      .attr("x2", (value) => x(value))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom);
    svg
      .selectAll("line.plot-grid-y")
      .data(gridTicks)
      .join("line")
      .attr("class", "plot-grid plot-grid-y")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", (value) => y(value))
      .attr("y2", (value) => y(value));

    const axisX = svg.append("g").attr("class", "plot-axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3Api.axisBottom(x).tickValues([1, 3, 5, 7, 9, 10]).tickSize(0));
    const axisY = svg.append("g").attr("class", "plot-axis").attr("transform", `translate(${margin.left},0)`).call(d3Api.axisLeft(y).tickValues([1, 3, 5, 7, 9, 10]).tickSize(0));
    axisX.select("path").attr("class", "axis-line");
    axisY.select("path").attr("class", "axis-line");
    svg.append("text").attr("class", "axis-title").attr("data-axis", "x").attr("x", (margin.left + width - margin.right) / 2).attr("y", height - 12).attr("text-anchor", "middle").text("Information Importance / 信息重要程度");
    svg.append("text").attr("class", "axis-title").attr("data-axis", "y").attr("transform", `translate(14 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`).attr("text-anchor", "middle").text("Visual Prominence / 视觉显著程度");

    const points = svg
      .append("g")
      .attr("class", "hierarchy-points")
      .selectAll("g.hierarchy-point")
      .data(analysisData, (item) => item.id)
      .join((enter) => {
        const group = enter.append("g").attr("class", "hierarchy-point");
        group.append("circle").attr("r", 5);
        group.append("text");
        return group;
      })
      .attr("transform", (item) => `translate(${x(item.importance)},${y(item.prominence)})`)
      .attr("data-module-id", (item) => item.id)
      .style("--point-color", (item) => colors[item.kind] || colors.annotation);

    points.select("circle").attr("fill", (item) => colors[item.kind] || colors.annotation);
    points
      .select("text")
      .attr("class", "point-label")
      .attr("x", 9)
      .attr("y", 3)
      .text((item) => ["chart-major", "chart-progress", "kpi-total"].includes(item.id) ? item.label : "");
    bindInteractive(points);
    svg.on("click", () => {
      state.selectedId = null;
      state.previewId = null;
      updateSelection();
    });
    updateSelection();
  }

  function renderMinimap() {
    const width = Math.floor(minimapHost.getBoundingClientRect().width);
    if (!width || !layoutMeasurements.length) return;
    const layoutWidth = Math.max(1, dashboard.getBoundingClientRect().width);
    const layoutHeight = Math.max(1, dashboard.getBoundingClientRect().height);
    const height = Math.max(290, Math.min(390, width * 1.18));
    const innerWidth = width - 28;
    const innerHeight = height - 22;
    const scale = Math.min(innerWidth / layoutWidth, innerHeight / layoutHeight);
    const offsetX = (width - layoutWidth * scale) / 2;
    const offsetY = (height - layoutHeight * scale) / 2;

    minimapHost.replaceChildren();
    const svg = d3Api
      .select(minimapHost)
      .append("svg")
      .attr("class", "minimap-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Dashboard 当前布局 Minimap");
    svg.append("rect").attr("class", "minimap-frame").attr("x", offsetX).attr("y", offsetY).attr("width", layoutWidth * scale).attr("height", layoutHeight * scale);
    const modules = svg
      .append("g")
      .attr("class", "minimap-modules")
      .selectAll("rect.minimap-module")
      .data(layoutMeasurements, (item) => item.id)
      .join("rect")
      .attr("class", "minimap-module")
      .attr("data-module-id", (item) => item.id)
      .attr("x", (item) => offsetX + item.x * scale)
      .attr("y", (item) => offsetY + item.y * scale)
      .attr("width", (item) => Math.max(2, item.width * scale))
      .attr("height", (item) => Math.max(2, item.height * scale))
      .attr("fill", (item) => colors[getModuleKind(metadataFor(item.id))] || "#cdd4d0");
    bindInteractive(modules);
    svg.on("click", () => {
      state.selectedId = null;
      state.previewId = null;
      updateSelection();
    });
    updateSelection();
  }

  function metadataFor(id) {
    return (window.dashboardModules || []).find((module) => module.id === id) || { id, role: "annotation" };
  }

  function renderMismatchRanking() {
    const top = [...analysisData].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 3);
    const items = d3Api
      .select(ranking)
      .selectAll("li.mismatch-item")
      .data(top, (item) => item.id)
      .join((enter) => {
        const item = enter.append("li").attr("class", "mismatch-item");
        const button = item.append("button").attr("type", "button");
        button.append("span").attr("class", "mismatch-rank");
        button.append("span").attr("class", "mismatch-copy");
        button.append("span").attr("class", "mismatch-status");
        return item;
      });
    items.select("button").on("click", (event, item) => {
      event.stopPropagation();
      state.selectedId = item.id;
      state.previewId = null;
      updateSelection();
    });
    items.select(".mismatch-rank").text((_, index) => index + 1);
    items.select(".mismatch-copy").html((item) => `<strong>${item.label}</strong><span>Importance ${item.importance} · Prominence ${item.prominence.toFixed(1)}</span>`);
    items.select(".mismatch-status").text((item) => item.interpretation);
    updateSelection();
  }

  function renderAll() {
    if (!dashboardReady && !window.dashboardReady) return;
    dashboardReady = true;
    measureDashboard();
    computeProminence();
    renderScatter();
    renderMinimap();
    renderMismatchRanking();
  }

  function scheduleRender() {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      renderAll();
    });
  }

  window.addEventListener("dashboard:ready", () => {
    dashboardReady = true;
    renderAll();
  });

  resetButton.addEventListener("click", () => {
    state.selectedId = null;
    state.previewId = null;
    updateSelection();
  });

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(dashboard);
    observer.observe(mapHost);
  } else {
    window.addEventListener("resize", scheduleRender);
  }

  if (window.dashboardReady) dashboardReady = true;
  renderAll();
})();
