(() => {
  const d3Api = window.d3;
  const mapHost = document.getElementById("allocation-map");
  const slider = document.getElementById("allocation-influence");
  const sliderValue = document.getElementById("allocation-influence-value");
  const summary = document.getElementById("allocation-summary");
  const stateLabel = document.getElementById("allocation-state");
  const resetButton = document.getElementById("allocation-reset");
  const detailTitle = document.getElementById("allocation-detail-title");
  const detailCopy = document.getElementById("allocation-detail-copy");
  const detailCurrent = document.getElementById("allocation-current-value");
  const detailImportance = document.getElementById("allocation-importance-value");
  const detailAllocated = document.getElementById("allocation-allocated-value");
  const detailChange = document.getElementById("allocation-change-value");
  const presetButtons = [...document.querySelectorAll("[data-allocation-preset]")];
  const dashboard = document.querySelector(".dashboard-shell");

  if (!d3Api || !mapHost || !slider || !sliderValue || !summary || !stateLabel || !resetButton || !detailTitle || !detailCopy || !detailCurrent || !detailImportance || !detailAllocated || !detailChange || !dashboard) return;

  const MIN_WEIGHT = 0.02;
  const tooltip = d3Api.select("#dashboard-tooltip").attr("role", "tooltip");
  const moduleSpecs = [
    { id: "kpi-total", groupKey: "overview", shortLabel: "总人数" },
    { id: "kpi-major", groupKey: "overview", shortLabel: "专业数" },
    { id: "kpi-region", groupKey: "overview", shortLabel: "生源区" },
    { id: "kpi-checkin", groupKey: "overview", shortLabel: "准备率" },
    { id: "chart-major", groupKey: "major", shortLabel: "专业构成" },
    { id: "chart-region", groupKey: "region", shortLabel: "地区 × 专业" },
    { id: "legend-region", groupKey: "region", shortLabel: "地区图例" },
    { id: "chart-progress", groupKey: "progress", shortLabel: "完成度" },
    { id: "dashboard-note", groupKey: "annotation", shortLabel: "说明" },
  ];
  const groupSpecs = [
    { id: "overview", label: "OVERVIEW", children: ["kpi-total", "kpi-major", "kpi-region", "kpi-checkin"] },
    { id: "major", label: "MAJOR", children: ["chart-major"] },
    { id: "region", label: "REGION", children: ["chart-region", "legend-region"] },
    { id: "progress", label: "PROGRESS", children: ["chart-progress"] },
    { id: "annotation", label: "ANNOTATION", children: ["dashboard-note"] },
  ];
  const presetValues = { current: 0, balanced: 50, importance: 100 };
  const state = {
    alpha: 0,
    selectedId: null,
    hoveredId: null,
  };

  let currentAllocation = null;
  let svg = null;
  let svgSize = null;
  let renderFrame = null;
  let renderAnimated = false;

  function getMetadata(id) {
    return (window.dashboardModules || []).find((module) => module.id === id) || null;
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatChange(value) {
    const points = value * 100;
    return `${points >= 0 ? "+" : ""}${points.toFixed(1)} pp`;
  }

  function getMeasurements() {
    if (window.dashboardLayout?.measureLayout) window.dashboardLayout.measureLayout();
    return window.dashboardLayout?.getMeasurements?.() || [];
  }

  function buildAllocation() {
    const metadataById = new Map((window.dashboardModules || []).map((module) => [module.id, module]));
    const measurements = new Map(getMeasurements().map((item) => [item.id, item]));
    const leaves = moduleSpecs.map((spec) => {
      const module = metadataById.get(spec.id);
      const measurement = measurements.get(spec.id);
      if (!module || !measurement) return null;
      return {
        ...module,
        ...spec,
        area: measurement.width * measurement.height,
      };
    });

    if (leaves.some((item) => !item) || !leaves.length) return null;

    const totalArea = d3Api.sum(leaves, (item) => item.area);
    const totalImportance = d3Api.sum(leaves, (item) => item.importance || 0);
    if (!totalArea || !totalImportance) return null;

    const weightedLeaves = leaves.map((item) => {
      const currentWeight = item.area / totalArea;
      const importanceWeight = (item.importance || 0) / totalImportance;
      const rawWeight = (1 - state.alpha) * currentWeight + state.alpha * importanceWeight;
      return {
        ...item,
        currentWeight,
        importanceWeight,
        rawWeight,
      };
    });
    const floorTotal = d3Api.sum(weightedLeaves, (item) => Math.max(item.rawWeight, MIN_WEIGHT));
    const allocationLeaves = weightedLeaves.map((item) => ({
      ...item,
      weight: Math.max(item.rawWeight, MIN_WEIGHT) / floorTotal,
    }));
    const leafById = new Map(allocationLeaves.map((item) => [item.id, item]));

    return {
      leaves: allocationLeaves,
      hierarchy: {
        id: "page",
        label: "PAGE",
        children: groupSpecs.map((group) => ({
          id: group.id,
          label: group.label,
          groupKey: group.id,
          children: group.children.map((id) => leafById.get(id)),
        })),
      },
    };
  }

  function getSelectedItem() {
    return currentAllocation?.leaves.find((item) => item.id === state.selectedId) || null;
  }

  function updateSummary() {
    const percentage = Math.round(state.alpha * 100);
    if (percentage === 0) {
      summary.textContent = "The map preserves current footprint proportions.";
      stateLabel.textContent = "CURRENT SPACE";
    } else if (percentage === 100) {
      summary.textContent = "Area follows information importance only, with a readable minimum floor.";
      stateLabel.textContent = "IMPORTANCE BIAS";
    } else {
      summary.textContent = "Current footprint and information importance share influence.";
      stateLabel.textContent = "MIXED SPACE";
    }
  }

  function updateControls() {
    const percentage = Math.round(state.alpha * 100);
    slider.value = String(percentage);
    sliderValue.textContent = `${percentage}%`;
    const preset = Object.entries(presetValues).find(([, value]) => value === percentage)?.[0] || null;
    presetButtons.forEach((button) => {
      const isActive = button.dataset.allocationPreset === preset;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    updateSummary();
  }

  function updateDetail() {
    const item = getSelectedItem();
    if (!item) {
      detailTitle.textContent = "Select a module";
      detailCopy.textContent = "Click a rectangle to compare its current footprint with its allocated area.";
      detailCurrent.textContent = "—";
      detailImportance.textContent = "—";
      detailAllocated.textContent = "—";
      detailChange.textContent = "—";
      return;
    }
    detailTitle.textContent = item.label;
    detailCopy.textContent = `${item.id} · allocation responds to ${Math.round(state.alpha * 100)}% importance influence.`;
    detailCurrent.textContent = formatPercent(item.currentWeight);
    detailImportance.textContent = `${item.importance} / 10`;
    detailAllocated.textContent = formatPercent(item.weight);
    detailChange.textContent = formatChange(item.weight - item.currentWeight);
  }

  function showTooltip(event, item) {
    if (!tooltip.node()) return;
    tooltip
      .attr("hidden", null)
      .html(`<strong>${item.label}</strong><span>Current footprint: ${formatPercent(item.currentWeight)}</span><span>Importance: ${item.importance} / 10</span><span>Allocation weight: ${formatPercent(item.weight)}</span><span>Allocated area: ${formatPercent(item.weight)}</span>`);
    const node = tooltip.node();
    const left = Math.min(event.clientX + 14, window.innerWidth - node.offsetWidth - 12);
    const top = Math.min(event.clientY + 14, window.innerHeight - node.offsetHeight - 12);
    tooltip.style("left", `${Math.max(12, left)}px`).style("top", `${Math.max(12, top)}px`);
  }

  function hideTooltip() {
    tooltip.attr("hidden", true);
  }

  function updateDashboardHighlight() {
    document.querySelectorAll(".dashboard-shell [data-module-id].is-linked-highlight").forEach((node) => node.classList.remove("is-linked-highlight"));
    if (!state.selectedId) return;
    document.querySelector(`.dashboard-shell [data-module-id="${state.selectedId}"]`)?.classList.add("is-linked-highlight");
  }

  function updateSelection() {
    const activeId = state.selectedId || state.hoveredId;
    d3Api.selectAll("#allocation-map .allocation-tile")
      .classed("is-selected", (item) => item.data.id === state.selectedId)
      .classed("is-preview", (item) => item.data.id === state.hoveredId)
      .select(".allocation-tile-delta")
      .classed("is-hidden", (item) => item.data.id !== activeId);
    updateDashboardHighlight();
    updateDetail();
  }

  function bindTileInteractions(tiles) {
    tiles
      .on("pointerenter", (event, item) => {
        state.hoveredId = item.data.id;
        showTooltip(event, item.data);
        updateSelection();
      })
      .on("pointermove", (event, item) => showTooltip(event, item.data))
      .on("pointerleave", () => {
        state.hoveredId = null;
        hideTooltip();
        updateSelection();
      })
      .on("click", (event, item) => {
        event.stopPropagation();
        state.selectedId = item.data.id;
        state.hoveredId = null;
        hideTooltip();
        updateSelection();
      });
  }

  function labelState(item) {
    const width = item.x1 - item.x0;
    const height = item.y1 - item.y0;
    const data = item.data;
    return {
      showLabel: width >= 60 && height >= 34,
      showValue: width >= 112 && height >= 60,
      label: width >= 150 && data.label.length < 12 ? data.label : data.shortLabel,
    };
  }

  function renderMap(animate) {
    if (!currentAllocation) return;
    const width = Math.floor(mapHost.getBoundingClientRect().width);
    if (!width) return;
    const height = Math.max(330, Math.min(500, width * 0.62));
    const sizeChanged = !svgSize || svgSize.width !== width || svgSize.height !== height;
    if (!svg || sizeChanged) {
      mapHost.replaceChildren();
      svg = d3Api
        .select(mapHost)
        .append("svg")
        .attr("class", "allocation-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "页面模块空间分配 Treemap");
      svg.append("title").text("Page Allocation Map");
      svg.append("desc").text("A conceptual treemap that compares current dashboard footprint with information importance.");
      svg.append("g").attr("class", "allocation-groups");
      svg.append("g").attr("class", "allocation-tiles");
      svgSize = { width, height };
      animate = false;
    }

    const root = d3Api
      .hierarchy(currentAllocation.hierarchy)
      .sum((item) => item.weight || 0);
    d3Api
      .treemap()
      .size([width, height])
      .round(false)
      .paddingOuter(8)
      .paddingInner(5)
      .paddingTop((item) => (item.depth === 1 ? 26 : 5))(root);

    const transition = (selection) => {
      selection.interrupt();
      return animate ? selection.transition().duration(400).ease(d3Api.easeCubicInOut) : selection;
    };

    const groups = svg
      .select(".allocation-groups")
      .selectAll("g.allocation-group-region")
      .data(root.children || [], (item) => item.data.id)
      .join((enter) => {
        const group = enter.append("g").attr("class", "allocation-group-region");
        group.append("rect");
        group.append("text");
        return group;
      });
    transition(groups).attr("transform", (item) => `translate(${item.x0},${item.y0})`);
    transition(groups.select("rect"))
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (item) => item.x1 - item.x0)
      .attr("height", (item) => item.y1 - item.y0);
    groups.select("text").attr("x", 8).attr("y", 17).text((item) => item.data.label);

    const leaves = svg
      .select(".allocation-tiles")
      .selectAll("g.allocation-tile")
      .data(root.leaves(), (item) => item.data.id)
      .join((enter) => {
        const tile = enter.append("g").attr("class", "allocation-tile");
        tile.append("rect");
        tile.append("text").attr("class", "allocation-tile-label");
        tile.append("text").attr("class", "allocation-tile-value");
        tile.append("text").attr("class", "allocation-tile-delta");
        return tile;
      });

    leaves
      .attr("class", (item) => `allocation-tile allocation-tile--${item.data.groupKey}`)
      .attr("data-module-id", (item) => item.data.id)
      .attr("aria-label", (item) => `${item.data.label}，${formatPercent(item.data.weight)} allocated area`);
    const tileTransition = transition(leaves);
    tileTransition.attr("transform", (item) => `translate(${item.x0},${item.y0})`);
    transition(leaves.select("rect"))
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", (item) => item.x1 - item.x0)
      .attr("height", (item) => item.y1 - item.y0);

    leaves.each(function (item) {
      const labels = labelState(item);
      const width = item.x1 - item.x0;
      const height = item.y1 - item.y0;
      const tile = d3Api.select(this);
      tile.select(".allocation-tile-label").classed("is-hidden", !labels.showLabel).attr("x", 8).attr("y", Math.min(25, Math.max(16, height / 2 - 2))).text(labels.label);
      tile.select(".allocation-tile-value").classed("is-hidden", !labels.showValue).attr("x", 8).attr("y", Math.min(height - 12, Math.max(39, height / 2 + 17))).text(`Importance ${item.data.importance}`);
      tile.select(".allocation-tile-delta").classed("is-hidden", item.data.id !== (state.selectedId || state.hoveredId)).attr("x", Math.max(8, width - 62)).attr("y", Math.max(16, height - 10)).text(formatChange(item.data.weight - item.data.currentWeight));
    });
    bindTileInteractions(leaves);
    updateSelection();
  }

  function refresh(animate = false) {
    const next = buildAllocation();
    if (!next) return;
    currentAllocation = next;
    updateControls();
    renderMap(animate);
    updateDetail();
  }

  function scheduleRefresh(animate = true) {
    renderAnimated = renderAnimated || animate;
    if (renderFrame) return;
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null;
      const shouldAnimate = renderAnimated;
      renderAnimated = false;
      refresh(shouldAnimate);
    });
  }

  function setAlpha(value, animate = true) {
    state.alpha = Math.max(0, Math.min(1, Number(value) / 100));
    updateControls();
    scheduleRefresh(animate);
  }

  slider.addEventListener("input", (event) => setAlpha(event.target.value));
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => setAlpha(presetValues[button.dataset.allocationPreset]));
  });
  resetButton.addEventListener("click", () => {
    state.selectedId = null;
    state.hoveredId = null;
    hideTooltip();
    updateDashboardHighlight();
    setAlpha(0);
  });

  window.dashboardAllocation = {
    getState: () => ({ alpha: state.alpha, selectedId: state.selectedId, minWeight: MIN_WEIGHT, leaves: currentAllocation?.leaves || [] }),
  };

  window.addEventListener("dashboard:ready", () => scheduleRefresh(false));
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => scheduleRefresh(false));
    resizeObserver.observe(mapHost);
    resizeObserver.observe(dashboard);
  } else {
    window.addEventListener("resize", () => scheduleRefresh(false));
  }
  updateControls();
  if (window.dashboardReady) refresh(false);
})();
