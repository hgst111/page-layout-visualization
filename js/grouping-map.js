(() => {
  const d3Api = window.d3;
  const graphHost = document.getElementById("relationship-graph");
  const spatialHost = document.getElementById("spatial-layout");
  const detail = document.getElementById("grouping-detail");
  const summary = document.getElementById("grouping-summary");
  const stateLabel = document.getElementById("grouping-state");
  const spatialMeta = document.getElementById("grouping-spatial-meta");
  const resetButton = document.getElementById("grouping-reset");
  const reorganizeButton = document.getElementById("grouping-reorganize");
  const dashboard = document.querySelector(".dashboard-shell");

  if (!d3Api || !graphHost || !spatialHost || !detail || !summary || !stateLabel || !spatialMeta || !resetButton || !reorganizeButton || !dashboard) return;

  const graphIds = [
    "kpi-total",
    "kpi-major",
    "kpi-region",
    "kpi-checkin",
    "chart-major",
    "chart-region",
    "chart-progress",
    "legend-region",
    "filters",
    "dashboard-note",
  ];

  const dashboardRelationships = [
    { source: "kpi-total", target: "kpi-major", type: "overview", strength: 1.2 },
    { source: "kpi-total", target: "kpi-region", type: "overview", strength: 1.2 },
    { source: "kpi-total", target: "kpi-checkin", type: "overview", strength: 1.2 },
    { source: "kpi-major", target: "chart-major", type: "supports", strength: 3 },
    { source: "filters", target: "chart-major", type: "controls", strength: 2 },
    { source: "kpi-region", target: "chart-region", type: "supports", strength: 2.3 },
    { source: "filters", target: "chart-region", type: "controls", strength: 2 },
    { source: "chart-region", target: "legend-region", type: "explains", strength: 3 },
    { source: "kpi-checkin", target: "chart-progress", type: "supports", strength: 3 },
    { source: "filters", target: "chart-progress", type: "controls", strength: 2 },
    { source: "dashboard-note", target: "chart-region", type: "explains", strength: 1.2 },
  ];

  window.dashboardRelationships = dashboardRelationships;

  const groupedTargets = {
    filters: { x: 0.09, y: 0.075, width: 0.82, height: 0.06 },
    "kpi-total": { x: 0.06, y: 0.24, width: 0.2, height: 0.12 },
    "kpi-major": { x: 0.28, y: 0.24, width: 0.2, height: 0.12 },
    "kpi-region": { x: 0.5, y: 0.24, width: 0.2, height: 0.12 },
    "kpi-checkin": { x: 0.72, y: 0.24, width: 0.2, height: 0.12 },
    "chart-major": { x: 0.08, y: 0.5, width: 0.36, height: 0.18 },
    "chart-progress": { x: 0.56, y: 0.5, width: 0.36, height: 0.18 },
    "chart-region": { x: 0.08, y: 0.81, width: 0.36, height: 0.11 },
    "legend-region": { x: 0.47, y: 0.81, width: 0.15, height: 0.11 },
    "dashboard-note": { x: 0.7, y: 0.81, width: 0.23, height: 0.11 },
  };

  const groupedRegions = [
    { id: "control", label: "CONTROL", x: 0.04, y: 0.03, width: 0.92, height: 0.13 },
    { id: "overview", label: "OVERVIEW", x: 0.04, y: 0.2, width: 0.92, height: 0.21 },
    { id: "major-analysis", label: "MAJOR", x: 0.04, y: 0.46, width: 0.44, height: 0.27 },
    { id: "progress-analysis", label: "PROGRESS", x: 0.52, y: 0.46, width: 0.44, height: 0.27 },
    { id: "region-analysis", label: "REGION", x: 0.04, y: 0.77, width: 0.61, height: 0.19 },
    { id: "annotation", label: "ANNOTATION", x: 0.66, y: 0.77, width: 0.3, height: 0.19 },
  ];

  const state = {
    selectedId: null,
    previewId: null,
    mode: "current",
  };

  const FAR_THRESHOLD = 0.15;
  const metadataFallback = {
    "kpi-total": { label: "新生总数", role: "primary-kpi", group: "overview", importance: 8 },
    "kpi-major": { label: "专业数量", role: "supporting-kpi", group: "overview", importance: 5 },
    "kpi-region": { label: "生源区域", role: "supporting-kpi", group: "overview", importance: 5 },
    "kpi-checkin": { label: "准备完成率", role: "supporting-kpi", group: "overview", importance: 6 },
    "chart-major": { label: "专业构成", role: "primary-visualization", group: "major-analysis", importance: 9 },
    "chart-region": { label: "地区与专业大类", role: "primary-visualization", group: "region-analysis", importance: 8 },
    "chart-progress": { label: "入学准备完成度", role: "supporting-visualization", group: "progress-analysis", importance: 6 },
    "legend-region": { label: "地区图例", role: "legend", group: "region-analysis", importance: 3 },
    filters: { label: "筛选器", role: "control", group: "control", importance: 4 },
    "dashboard-note": { label: "Dashboard 说明", role: "annotation", group: "overview", importance: 3 },
  };

  let measurements = [];
  let relationshipLinks = [];
  let spatialNodes = [];
  let graphSvg = null;
  let spatialSvg = null;
  let spatialSize = null;
  let renderFrame = null;
  let dashboardReady = false;

  const tooltip = d3Api.select("#dashboard-tooltip").attr("role", "tooltip");

  function getMetadata(id) {
    return (window.dashboardModules || []).find((module) => module.id === id) || metadataFallback[id] || { id, label: id, role: "annotation", group: "annotation", importance: 0 };
  }

  function getLabel(id) {
    const labels = {
      "kpi-region": "生源区域",
      "legend-region": "地区图例",
    };
    return labels[id] || getMetadata(id).label || id;
  }

  function getKind(module) {
    if (module.role?.includes("kpi")) return "kpi";
    if (module.role === "control") return "control";
    if (module.role === "legend") return "legend";
    if (module.role?.includes("visualization")) return "visualization";
    return "annotation";
  }

  function getNodeData() {
    const measured = new Map(measurements.map((item) => [item.id, item]));
    return graphIds
      .map((id) => {
        const module = getMetadata(id);
        const measurement = measured.get(id);
        if (!measurement) return null;
        return {
          ...module,
          id,
          label: getLabel(id),
          kind: getKind(module),
          measurement,
        };
      })
      .filter(Boolean);
  }

  function refreshMeasurements() {
    if (window.dashboardLayout?.measureLayout) window.dashboardLayout.measureLayout();
    measurements = window.dashboardLayout?.getMeasurements?.() || [];
    const measured = new Map(measurements.map((item) => [item.id, item]));
    const dashboardRect = dashboard.getBoundingClientRect();
    const diagonal = Math.max(1, Math.hypot(dashboardRect.width, dashboardRect.height));
    relationshipLinks = dashboardRelationships
      .map((relationship) => {
        const source = measured.get(relationship.source);
        const target = measured.get(relationship.target);
        if (!source || !target) return null;
        const distance = Math.hypot(source.centerX - target.centerX, source.centerY - target.centerY);
        const normalizedDistance = distance / diagonal;
        return {
          ...relationship,
          id: `${relationship.source}-${relationship.target}`,
          distance,
          normalizedDistance,
          strong: relationship.strength >= 2.5,
          far: relationship.strength >= 2.5 && normalizedDistance > FAR_THRESHOLD,
        };
      })
      .filter(Boolean);
  }

  function showTooltip(event, item) {
    const related = relationshipLinks.filter((relationship) => relationship.source === item.id || relationship.target === item.id);
    const relatedLabels = related.map((relationship) => getLabel(relationship.source === item.id ? relationship.target : relationship.source));
    tooltip
      .attr("hidden", null)
      .html(`<strong>${item.label}</strong><span>Module：${item.id}</span><span>Group：${item.group || "annotation"}</span><span>Importance：${item.importance ?? "—"} / 10</span><span>Relationships：${relatedLabels.join("、") || "—"}</span>`);
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

  function isRelated(activeId, id) {
    return Boolean(activeId && relationshipLinks.some((relationship) => (relationship.source === activeId && relationship.target === id) || (relationship.target === activeId && relationship.source === id)));
  }

  function isRelatedLink(activeId, relationship) {
    const sourceId = typeof relationship.source === "string" ? relationship.source : relationship.source?.id;
    const targetId = typeof relationship.target === "string" ? relationship.target : relationship.target?.id;
    return Boolean(activeId && (sourceId === activeId || targetId === activeId));
  }

  function updateDetail() {
    const paragraph = detail.querySelector("p");
    if (!paragraph) return;
    const activeId = getActiveId();
    if (!activeId) {
      const focus = relationshipLinks.find((relationship) => relationship.source === "chart-region" && relationship.target === "legend-region");
      if (focus) {
        const distanceLabel = state.mode === "current" ? (focus.far ? "Far" : "Moderate") : "Closer";
        paragraph.textContent = `地区与专业大类 ↔ 地区图例 · Strong · Spatial distance: ${distanceLabel} · ${state.mode === "current" ? "关系紧密，但空间分组较弱。" : "Grouped state 让紧密关系共享更近的空间区域。"}`;
      }
      detail.classList.remove("has-selection");
      return;
    }
    const related = relationshipLinks.filter((relationship) => relationship.source === activeId || relationship.target === activeId);
    const farCount = related.filter((relationship) => relationship.far).length;
    paragraph.textContent = `${getLabel(activeId)} · ${related.length} direct relationships · ${farCount} strong-but-far${state.mode === "grouped" ? " · Grouped arrangement" : ""}`;
    detail.classList.add("has-selection");
  }

  function updateSummary() {
    const strongCount = relationshipLinks.filter((relationship) => relationship.strong).length;
    const farCount = relationshipLinks.filter((relationship) => relationship.far).length;
    summary.textContent = `Strong relationships: ${strongCount} · Strong-but-far: ${farCount} · ${state.mode === "grouped" ? "Grouped state: semantic groups are spatially closer." : "Current state: compare semantic links with real spatial distance."}`;
    stateLabel.textContent = state.mode === "grouped" ? "GROUPED" : "CURRENT";
    spatialMeta.textContent = state.mode === "grouped" ? "GROUPED ARRANGEMENT" : "CURRENT DOM";
    reorganizeButton.textContent = state.mode === "grouped" ? "Restore original" : "Reorganize";
  }

  function updateSelection() {
    const activeId = getActiveId();
    const focusId = !activeId ? "chart-region-legend-region" : null;
    d3Api.selectAll("#relationship-graph .relationship-node")
      .classed("is-active", (item) => item.id === activeId)
      .classed("is-selected", (item) => item.id === state.selectedId)
      .classed("is-related", (item) => isRelated(activeId, item.id));
    d3Api.selectAll("#relationship-graph .relationship-link")
      .classed("is-active", (item) => isRelatedLink(activeId, item))
      .classed("is-focus", (item) => item.id === focusId);
    d3Api.selectAll("#spatial-layout .spatial-node")
      .classed("is-active", (item) => item.id === activeId)
      .classed("is-selected", (item) => item.id === state.selectedId)
      .classed("is-related", (item) => isRelated(activeId, item.id));
    d3Api.selectAll("#spatial-layout .spatial-link")
      .classed("is-active", (item) => isRelatedLink(activeId, item))
      .classed("is-focus", (item) => item.id === focusId);
    updateDetail();
    updateSummary();
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

  function renderGraph() {
    const width = Math.floor(graphHost.getBoundingClientRect().width);
    if (!width || !relationshipLinks.length) return;
    const height = Math.max(410, Math.min(540, width * 0.95));
    const nodeData = getNodeData().map((node) => ({
      ...node,
      width: node.kind === "annotation" ? 112 : node.kind === "visualization" ? 104 : 86,
      height: 34,
      x: width / 2,
      y: height / 2,
    }));
    const nodeById = new Map(nodeData.map((node) => [node.id, node]));
    const linkData = relationshipLinks
      .filter((relationship) => nodeById.has(relationship.source) && nodeById.has(relationship.target))
      .map((relationship) => ({ ...relationship }));

    const simulation = d3Api
      .forceSimulation(nodeData)
      .force("link", d3Api.forceLink(linkData).id((node) => node.id).distance((link) => link.strong ? 88 : 106).strength((link) => 0.45 + link.strength / 8))
      .force("charge", d3Api.forceManyBody().strength(-250))
      .force("center", d3Api.forceCenter(width / 2, height / 2))
      .force("collide", d3Api.forceCollide().radius((node) => node.width / 2 + 18).strength(1))
      .stop();

    for (let index = 0; index < 220; index += 1) {
      simulation.tick();
      nodeData.forEach((node) => {
        node.x = Math.max(node.width / 2 + 12, Math.min(width - node.width / 2 - 12, node.x));
        node.y = Math.max(node.height / 2 + 12, Math.min(height - node.height / 2 - 12, node.y));
      });
    }

    graphHost.replaceChildren();
    graphSvg = d3Api
      .select(graphHost)
      .append("svg")
      .attr("class", "relationship-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Dashboard 信息关系图");
    graphSvg.append("title").text("Information Relationship Graph");
    graphSvg.append("desc").text("Dashboard modules connected by overview, supports, controls, and explains relationships.");

    const links = graphSvg
      .append("g")
      .attr("class", "relationship-links")
      .selectAll("line.relationship-link")
      .data(linkData, (item) => item.id)
      .join("line")
      .attr("class", (item) => `relationship-link relationship-link--${item.type}${item.strong ? " is-strong" : ""}`)
      .attr("data-link-id", (item) => item.id)
      .attr("x1", (item) => item.source.x)
      .attr("y1", (item) => item.source.y)
      .attr("x2", (item) => item.target.x)
      .attr("y2", (item) => item.target.y);

    const nodes = graphSvg
      .append("g")
      .attr("class", "relationship-nodes")
      .selectAll("g.relationship-node")
      .data(nodeData, (item) => item.id)
      .join((enter) => {
        const node = enter.append("g").attr("class", "relationship-node");
        node.append("rect");
        node.append("text");
        return node;
      })
      .attr("data-module-id", (item) => item.id)
      .attr("class", (item) => `relationship-node relationship-node--${item.kind}`)
      .attr("aria-label", (item) => `${item.label}，${item.id}`);

    nodes.select("rect").attr("x", (item) => -item.width / 2).attr("y", (item) => -item.height / 2).attr("width", (item) => item.width).attr("height", (item) => item.height);
    nodes.select("text").attr("text-anchor", "middle").attr("dy", "0.35em").text((item) => item.label);
    nodes.attr("transform", (item) => `translate(${item.x},${item.y})`);
    bindInteractive(nodes);
    graphSvg.on("click", () => {
      state.selectedId = null;
      state.previewId = null;
      updateSelection();
    });
    updateSelection();
  }

  function getCurrentSpatialNodes(width, height) {
    const layoutWidth = Math.max(1, dashboard.getBoundingClientRect().width);
    const layoutHeight = Math.max(1, dashboard.getBoundingClientRect().height);
    const scale = Math.min((width - 32) / layoutWidth, (height - 32) / layoutHeight);
    const offsetX = (width - layoutWidth * scale) / 2;
    const offsetY = (height - layoutHeight * scale) / 2;
    return getNodeData().map((node) => {
      const measurement = node.measurement;
      return {
        ...node,
        x: offsetX + measurement.x * scale,
        y: offsetY + measurement.y * scale,
        width: Math.max(18, measurement.width * scale),
        height: Math.max(18, measurement.height * scale),
      };
    });
  }

  function getGroupedSpatialNodes(width, height) {
    const innerWidth = width - 32;
    const innerHeight = height - 32;
    return getNodeData().map((node) => {
      const target = groupedTargets[node.id];
      return {
        ...node,
        x: 16 + target.x * innerWidth,
        y: 16 + target.y * innerHeight,
        width: target.width * innerWidth,
        height: target.height * innerHeight,
      };
    });
  }

  function renderSpatial(animate = false) {
    const width = Math.floor(spatialHost.getBoundingClientRect().width);
    if (!width || !relationshipLinks.length) return;
    const height = Math.max(470, Math.min(620, width * 1.2));
    const sizeChanged = !spatialSize || spatialSize.width !== width || spatialSize.height !== height;
    if (!spatialSvg || sizeChanged) {
      spatialHost.replaceChildren();
      spatialSvg = d3Api
        .select(spatialHost)
        .append("svg")
        .attr("class", "spatial-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Dashboard 空间关系视图");
      spatialSvg.append("title").text("Spatial Layout View");
      spatialSvg.append("desc").text("A simplified spatial representation based on the real Dashboard module bounds.");
      spatialSvg.append("rect").attr("class", "spatial-frame").attr("x", 16).attr("y", 16).attr("width", width - 32).attr("height", height - 32);
      spatialSvg.append("g").attr("class", "spatial-group-regions");
      spatialSvg.append("g").attr("class", "spatial-links");
      spatialSvg.append("g").attr("class", "spatial-nodes");
      spatialSize = { width, height };
      animate = false;
    }

    spatialNodes = state.mode === "grouped" ? getGroupedSpatialNodes(width, height) : getCurrentSpatialNodes(width, height);
    const nodeById = new Map(spatialNodes.map((node) => [node.id, node]));
    const duration = animate ? 650 : 0;
    const transition = (selection) => (duration ? selection.transition().duration(duration).ease(d3Api.easeCubicInOut) : selection);

    const regions = spatialSvg.select(".spatial-group-regions").selectAll("g.spatial-group-region").data(groupedRegions, (item) => item.id).join((enter) => {
      const group = enter.append("g").attr("class", "spatial-group-region");
      group.append("rect");
      group.append("text");
      return group;
    });
    regions.classed("is-visible", state.mode === "grouped");
    regions.select("rect").attr("x", (item) => 16 + item.x * (width - 32)).attr("y", (item) => 16 + item.y * (height - 32)).attr("width", (item) => item.width * (width - 32)).attr("height", (item) => item.height * (height - 32));
    regions.select("text").attr("x", (item) => 22 + item.x * (width - 32)).attr("y", (item) => 28 + item.y * (height - 32)).text((item) => item.label);

    const links = spatialSvg
      .select(".spatial-links")
      .selectAll("line.spatial-link")
      .data(relationshipLinks, (item) => item.id)
      .join("line")
      .attr("class", (item) => `spatial-link spatial-link--${item.type}${item.strong ? " is-strong" : ""}`)
      .attr("data-link-id", (item) => item.id);
    transition(links)
      .attr("x1", (item) => nodeById.get(item.source).x + nodeById.get(item.source).width / 2)
      .attr("y1", (item) => nodeById.get(item.source).y + nodeById.get(item.source).height / 2)
      .attr("x2", (item) => nodeById.get(item.target).x + nodeById.get(item.target).width / 2)
      .attr("y2", (item) => nodeById.get(item.target).y + nodeById.get(item.target).height / 2);

    const nodes = spatialSvg
      .select(".spatial-nodes")
      .selectAll("g.spatial-node")
      .data(spatialNodes, (item) => item.id)
      .join((enter) => {
        const node = enter.append("g").attr("class", "spatial-node");
        node.append("rect");
        node.append("text");
        return node;
      })
      .attr("data-module-id", (item) => item.id)
      .attr("class", (item) => `spatial-node spatial-node--${item.kind}`)
      .attr("aria-label", (item) => `${item.label}，${item.id}`);

    transition(nodes)
      .attr("transform", (item) => `translate(${item.x},${item.y})`);
    nodes.select("rect").attr("x", 0).attr("y", 0).attr("width", (item) => item.width).attr("height", (item) => item.height);
    nodes.select("text").attr("x", (item) => item.width / 2).attr("y", (item) => item.height / 2).attr("text-anchor", "middle").attr("dy", "0.35em").text((item) => item.width < 52 ? (item.id === "legend-region" ? "图例" : item.label.slice(0, 3)) : item.label);
    bindInteractive(nodes);
    spatialSvg.on("click", () => {
      state.selectedId = null;
      state.previewId = null;
      updateSelection();
    });
    updateSelection();
  }

  function renderAll(animate = false) {
    if (!dashboardReady && !window.dashboardReady) return;
    dashboardReady = true;
    refreshMeasurements();
    if (!relationshipLinks.length) return;
    renderGraph();
    renderSpatial(animate);
    updateSummary();
  }

  function scheduleRender() {
    if (renderFrame) return;
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null;
      renderAll(false);
    });
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    renderSpatial(true);
    updateSelection();
  }

  window.addEventListener("dashboard:ready", () => {
    dashboardReady = true;
    renderAll(false);
  });

  resetButton.addEventListener("click", () => {
    state.selectedId = null;
    state.previewId = null;
    state.mode = "current";
    renderSpatial(true);
    updateSelection();
  });

  reorganizeButton.addEventListener("click", () => {
    setMode(state.mode === "current" ? "grouped" : "current");
  });

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(dashboard);
    observer.observe(graphHost);
    observer.observe(spatialHost);
  } else {
    window.addEventListener("resize", scheduleRender);
  }

  if (window.dashboardReady) dashboardReady = true;
  renderAll(false);
})();
