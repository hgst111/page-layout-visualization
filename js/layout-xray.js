(() => {
  const d3Api = window.d3;

  if (!d3Api) return;

  const moduleColors = {
    overview: "#5b6f92",
    "region-analysis": "#6f7f77",
    control: "#8a7891",
    "major-analysis": "#8b745f",
    "progress-analysis": "#6d8497",
  };

  function createLayoutXRay(config) {
    const root = config.root;
    const overlay = config.overlay || root?.querySelector(".dashboard-xray-overlay");
    const toggle = config.controls?.toggle;
    const options = config.controls?.options;
    const resetButton = config.controls?.reset;
    const inspectPanel = config.controls?.inspectPanel;
    const inspectContent = config.controls?.inspectContent;

    if (!root || !overlay || !toggle || !options || !resetButton) return null;

    const state = {
      enabled: false,
      bounds: true,
      alignment: false,
      spacing: false,
      groups: false,
      readingOrder: false,
    };

    const metadata = new Map((config.metadata || window.dashboardModules || []).map((module) => [module.id, module]));
    const overlaySelection = d3Api.select(overlay);
    const layers = {
      groups: overlaySelection.append("g").attr("class", "xray-groups"),
      alignment: overlaySelection.append("g").attr("class", "xray-alignment"),
      spacing: overlaySelection.append("g").attr("class", "xray-spacing"),
      bounds: overlaySelection.append("g").attr("class", "xray-bounds"),
      readingOrder: overlaySelection.append("g").attr("class", "xray-reading-order"),
    };

    let measurements = [];
    let auxiliaryMeasurements = [];
    let highlightedModule = null;
    let resizeFrame = null;

    function getRootElement(selector, fallbackId) {
      return root.querySelector(selector) || (fallbackId ? root.querySelector(`#${fallbackId}`) : null);
    }

    function measureElement(node, overlayRect, module) {
      const rect = node.getBoundingClientRect();
      return {
        node,
        id: module.id,
        label: module.label || node.dataset.moduleLabel || module.id,
        role: module.role,
        group: module.group,
        importance: module.importance,
        readingOrder: module.readingOrder,
        x: rect.left - overlayRect.left,
        y: rect.top - overlayRect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right - overlayRect.left,
        bottom: rect.bottom - overlayRect.top,
        centerX: rect.left - overlayRect.left + rect.width / 2,
        centerY: rect.top - overlayRect.top + rect.height / 2,
      };
    }

    function measureLayout() {
      const overlayRect = overlay.getBoundingClientRect();
      const nodes = [...root.querySelectorAll("[data-module-id]")];
      measurements = nodes
        .map((node) => {
          const module = metadata.get(node.dataset.moduleId) || {
            id: node.dataset.moduleId,
            label: node.dataset.moduleLabel || node.dataset.moduleId,
            group: "unclassified",
            importance: 0,
          };
          return measureElement(node, overlayRect, module);
        })
        .filter((item) => item.width > 0 && item.height > 0);

      const heatmap = getRootElement('[data-dashboard-chart="heatmap"]', "region-heatmap");
      const legend = getRootElement('[data-module-id="legend-region"]', "legend-region");
      auxiliaryMeasurements = [];
      if (heatmap && legend) {
        const heatmapRect = measureElement(heatmap, overlayRect, {
          id: "region-heatmap",
          label: "Heatmap",
          group: "region-analysis",
          importance: 0,
        });
        const legendRect = measurements.find((item) => item.id === "legend-region");
        if (legendRect) auxiliaryMeasurements.push({ heatmap: heatmapRect, legend: legendRect });
      }

      overlay.setAttribute("viewBox", `0 0 ${Math.max(1, overlayRect.width)} ${Math.max(1, overlayRect.height)}`);
      renderLayout();
    }

    function labelWidth(label) {
      return Math.min(138, Math.max(52, label.length * 8 + 12));
    }

    function renderBounds() {
      const groups = layers.bounds
        .selectAll("g.xray-bound")
        .data(measurements, (item) => item.id)
        .join((enter) => {
          const group = enter.append("g").attr("class", "xray-bound");
          group.append("rect").attr("class", "xray-bound-box");
          group.append("rect").attr("class", "xray-label-bg");
          group.append("text").attr("class", "xray-label");
          return group;
        });

      groups
        .classed("is-highlighted", (item) => item.id === highlightedModule)
        .attr("transform", (item) => `translate(${item.x},${item.y})`);
      groups
        .select(".xray-bound-box")
        .attr("width", (item) => item.width)
        .attr("height", (item) => item.height);
      groups
        .select(".xray-label-bg")
        .attr("width", (item) => labelWidth(item.label))
        .attr("height", 16);
      groups
        .select(".xray-label")
        .attr("x", 5)
        .attr("y", 11)
        .text((item) => item.label);
    }

    function clusterEdges(values, tolerance = 6) {
      const clusters = [];
      values
        .slice()
        .sort((a, b) => a - b)
        .forEach((value) => {
          const current = clusters[clusters.length - 1];
          if (!current || value - current.mean > tolerance) {
            clusters.push({ values: [value], mean: value });
          } else {
            current.values.push(value);
            current.mean = current.values.reduce((sum, item) => sum + item, 0) / current.values.length;
          }
        });
      return clusters.filter((cluster) => cluster.values.length >= 2);
    }

    function renderAlignment() {
      const lines = [
        ...clusterEdges(measurements.map((item) => item.x)).map((cluster) => ({ type: "left", position: cluster.mean })),
        ...clusterEdges(measurements.map((item) => item.right)).map((cluster) => ({ type: "right", position: cluster.mean })),
      ];

      const guideGroups = layers.alignment
        .selectAll("g.xray-alignment-guide")
        .data(lines, (item) => `${item.type}-${Math.round(item.position)}`)
        .join((enter) => {
          const group = enter.append("g").attr("class", "xray-alignment-guide");
          group.append("line");
          group.append("text");
          return group;
        });

      guideGroups
        .select("line")
        .attr("x1", (item) => item.position)
        .attr("x2", (item) => item.position)
        .attr("y1", 0)
        .attr("y2", overlay.getBoundingClientRect().height);
      guideGroups
        .select("text")
        .attr("x", (item) => item.position + 4)
        .attr("y", 12)
        .text((item) => (item.type === "left" ? "L" : "R"));
    }

    function getMeasurement(id) {
      return measurements.find((item) => item.id === id);
    }

    function addHorizontalMeasurement(items, first, second, label, offset = 0) {
      const start = first.right;
      const end = second.x;
      if (end <= start) return;
      const y = Math.max(first.y + first.height, second.y + second.height) + offset;
      items.push({ type: "horizontal", start, end, y, label });
    }

    function addVerticalMeasurement(items, first, second, label) {
      const start = first.bottom;
      const end = second.y;
      if (end <= start) return;
      const x = Math.max(first.x + first.width, second.x + second.width) + 8;
      items.push({ type: "vertical", x, start, end, label });
    }

    function renderSpacing() {
      const items = [];
      const kpiTotal = getMeasurement("kpi-total");
      const kpiMajor = getMeasurement("kpi-major");
      const chartMajor = getMeasurement("chart-major");
      const chartProgress = getMeasurement("chart-progress");
      const filters = getMeasurement("filters");
      const regionPair = auxiliaryMeasurements[0];

      if (kpiTotal && kpiMajor) addHorizontalMeasurement(items, kpiTotal, kpiMajor, "KPI gap");
      if (chartMajor && chartProgress) addHorizontalMeasurement(items, chartMajor, chartProgress, "chart gutter", 8);
      if (filters && kpiTotal) addVerticalMeasurement(items, filters, kpiTotal, "KPI offset");
      if (regionPair) addHorizontalMeasurement(items, regionPair.heatmap, regionPair.legend, "legend gap", 6);

      const groups = layers.spacing
        .selectAll("g.xray-spacing-measurement")
        .data(items, (item) => `${item.type}-${item.label}-${item.start || item.x}`)
        .join((enter) => {
          const group = enter.append("g").attr("class", "xray-spacing-measurement");
          group.append("line").attr("class", "xray-measure-line");
          group.append("line").attr("class", "xray-measure-tick xray-measure-tick-start");
          group.append("line").attr("class", "xray-measure-tick xray-measure-tick-end");
          group.append("text").attr("class", "xray-measure-label");
          return group;
        });

      groups.each(function (item) {
        const group = d3Api.select(this);
        if (item.type === "horizontal") {
          const mid = (item.start + item.end) / 2;
          group.select(".xray-measure-line").attr("x1", item.start).attr("x2", item.end).attr("y1", item.y).attr("y2", item.y);
          group.select(".xray-measure-tick-start").attr("x1", item.start).attr("x2", item.start).attr("y1", item.y - 4).attr("y2", item.y + 4);
          group.select(".xray-measure-tick-end").attr("x1", item.end).attr("x2", item.end).attr("y1", item.y - 4).attr("y2", item.y + 4);
          group.select(".xray-measure-label").attr("x", mid).attr("y", item.y - 6).attr("text-anchor", "middle").text(`${Math.round(item.end - item.start)} px`);
        } else {
          const mid = (item.start + item.end) / 2;
          group.select(".xray-measure-line").attr("x1", item.x).attr("x2", item.x).attr("y1", item.start).attr("y2", item.end);
          group.select(".xray-measure-tick-start").attr("x1", item.x - 4).attr("x2", item.x + 4).attr("y1", item.start).attr("y2", item.start);
          group.select(".xray-measure-tick-end").attr("x1", item.x - 4).attr("x2", item.x + 4).attr("y1", item.end).attr("y2", item.end);
          group.select(".xray-measure-label").attr("x", item.x + 6).attr("y", mid).attr("text-anchor", "start").text(`${Math.round(item.end - item.start)} px`);
        }
      });
    }

    function renderGroups() {
      const grouped = d3Api.group(measurements, (item) => item.group);
      const regions = [...grouped.entries()]
        .filter(([, items]) => items.length >= 2)
        .map(([group, items]) => ({
          group,
          x: Math.min(...items.map((item) => item.x)),
          y: Math.min(...items.map((item) => item.y)),
          right: Math.max(...items.map((item) => item.right)),
          bottom: Math.max(...items.map((item) => item.bottom)),
        }));

      const groups = layers.groups
        .selectAll("g.xray-group-region")
        .data(regions, (item) => item.group)
        .join((enter) => {
          const group = enter.append("g").attr("class", "xray-group-region");
          group.append("rect").attr("class", "xray-group-box");
          group.append("text").attr("class", "xray-group-label");
          return group;
        });

      groups.select(".xray-group-box").attr("x", (item) => item.x).attr("y", (item) => item.y).attr("width", (item) => item.right - item.x).attr("height", (item) => item.bottom - item.y).attr("stroke", (item) => moduleColors[item.group] || "#77827c");
      groups.select(".xray-group-label").attr("x", (item) => item.x + 5).attr("y", (item) => item.y + 12).text((item) => item.group.replaceAll("-", " ").toUpperCase());
    }

    function renderReadingOrder() {
      const ordered = measurements.filter((item) => Number.isFinite(item.readingOrder)).sort((a, b) => a.readingOrder - b.readingOrder);
      const line = d3Api.line().x((item) => item.centerX).y((item) => item.centerY).curve(d3Api.curveBumpX);

      layers.readingOrder
        .selectAll("path.xray-reading-path")
        .data(ordered.length > 1 ? [ordered] : [])
        .join((enter) => enter.append("path").attr("class", "xray-reading-path"))
        .attr("d", line);

      const markers = layers.readingOrder
        .selectAll("g.xray-reading-marker")
        .data(ordered, (item) => item.id)
        .join((enter) => {
          const group = enter.append("g").attr("class", "xray-reading-marker");
          group.append("circle").attr("r", 10);
          group.append("text");
          return group;
        });

      markers.attr("transform", (item) => `translate(${item.centerX},${item.centerY})`);
      markers.select("text").attr("y", 3.5).text((item) => item.readingOrder);
    }

    function updateInspect(item) {
      if (!inspectPanel || !inspectContent) return;
      if (!state.enabled) {
        inspectPanel.hidden = true;
        return;
      }
      inspectPanel.hidden = false;
      if (!item) {
        inspectContent.textContent = "Hover a module to inspect its layout.";
        return;
      }
      inspectContent.textContent = `模块：${item.label} · ID：${item.id} · Group：${item.group} · Importance：${item.importance} · Position：${Math.round(item.x)}, ${Math.round(item.y)} · Size：${Math.round(item.width)} × ${Math.round(item.height)}`;
    }

    function highlightModule(id) {
      highlightedModule = id;
      layers.bounds.selectAll("g.xray-bound").classed("is-highlighted", (item) => item.id === id);
      updateInspect(measurements.find((item) => item.id === id));
    }

    function bindModuleInteractions() {
      measurements.forEach((item) => {
        item.node.addEventListener("pointerenter", () => highlightModule(item.id));
        item.node.addEventListener("pointerleave", () => {
          if (!highlightedModule) updateInspect(null);
        });
        item.node.addEventListener("click", () => highlightModule(item.id));
      });
    }

    function renderLayout() {
      overlay.classList.toggle("is-visible", state.enabled);
      overlay.setAttribute("aria-hidden", String(!state.enabled));
      Object.entries(layers).forEach(([name, layer]) => {
        layer.style("display", state.enabled && state[name] ? null : "none");
      });
      renderBounds();
      if (state.alignment) renderAlignment();
      if (state.spacing) renderSpacing();
      if (state.groups) renderGroups();
      if (state.readingOrder) renderReadingOrder();
      updateInspect(measurements.find((item) => item.id === highlightedModule));
    }

    function scheduleMeasure() {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        measureLayout();
      });
    }

    function setEnabled(enabled) {
      state.enabled = enabled;
      toggle.setAttribute("aria-pressed", String(enabled));
      options.disabled = !enabled;
      renderLayout();
    }

    toggle.addEventListener("click", () => setEnabled(!state.enabled));
    options.addEventListener("change", (event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      const prefix = config.idPrefix || "";
      const stateKey = {
        [`${prefix}xray-bounds`]: "bounds",
        [`${prefix}xray-alignment`]: "alignment",
        [`${prefix}xray-spacing`]: "spacing",
        [`${prefix}xray-groups`]: "groups",
        [`${prefix}xray-reading-order`]: "readingOrder",
      }[event.target.id];
      if (!stateKey) return;
      state[stateKey] = event.target.checked;
      renderLayout();
    });
    resetButton.addEventListener("click", () => {
      state.enabled = false;
      state.bounds = true;
      state.alignment = false;
      state.spacing = false;
      state.groups = false;
      state.readingOrder = false;
      options.querySelectorAll("input").forEach((input) => {
        input.checked = input.id.endsWith("xray-bounds");
      });
      highlightedModule = null;
      setEnabled(false);
      updateInspect(null);
    });

    const resizeObserver = window.ResizeObserver ? new ResizeObserver(scheduleMeasure) : null;
    if (resizeObserver) resizeObserver.observe(root);
    else window.addEventListener("resize", scheduleMeasure);

    measureLayout();
    bindModuleInteractions();

    return {
      root,
      instance: config.instance || root.dataset.dashboardInstance || "dashboard",
      measureLayout,
      getMeasurements: () => measurements,
      getState: () => ({ ...state }),
      reset: () => resetButton.click(),
      setEnabled,
    };
  }

  const metadata = window.dashboardModules || [];
  const instances = [...document.querySelectorAll(".dashboard-shell[data-dashboard-instance]")]
    .map((root) => {
      const instance = root.dataset.dashboardInstance;
      const idPrefix = instance === "final" ? "final-" : "";
      return createLayoutXRay({
        root,
        instance,
        metadata,
        idPrefix,
        overlay: root.querySelector(".dashboard-xray-overlay"),
        controls: {
          toggle: document.getElementById(`${idPrefix}xray-toggle`),
          options: document.getElementById(`${idPrefix}xray-options`),
          reset: document.getElementById(`${idPrefix}xray-reset`),
          inspectPanel: document.getElementById(`${idPrefix}xray-inspect`),
          inspectContent: document.getElementById(`${idPrefix}xray-inspect-content`),
        },
      });
    })
    .filter(Boolean);

  window.dashboardXrayInstances = instances;
  window.dashboardLayoutInstances = Object.fromEntries(instances.map((instance) => [instance.instance, instance]));

  const initial = instances.find((instance) => instance.instance === "initial");
  if (initial) window.dashboardLayout = initial;
})();
