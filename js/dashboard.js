(() => {
  const d3Api = window.d3;
  const dashboardModules = [
    { id: "dashboard-header", label: "Dashboard 标题", role: "context", group: "overview", importance: 6, readingOrder: 1 },
    { id: "filters", label: "筛选器", role: "control", group: "control", importance: 4, readingOrder: 2 },
    { id: "kpi-total", label: "新生总数", role: "primary-kpi", group: "overview", importance: 8, readingOrder: 3 },
    { id: "kpi-major", label: "专业数量", role: "supporting-kpi", group: "overview", importance: 5, readingOrder: 4 },
    { id: "kpi-region", label: "生源区域数量", role: "supporting-kpi", group: "overview", importance: 5, readingOrder: 5 },
    { id: "kpi-checkin", label: "准备完成率", role: "supporting-kpi", group: "overview", importance: 6, readingOrder: 6 },
    { id: "chart-major", label: "专业构成", role: "primary-visualization", group: "major-analysis", importance: 9, readingOrder: 7 },
    { id: "chart-region", label: "地区与专业大类", role: "primary-visualization", group: "region-analysis", importance: 8, readingOrder: 8 },
    { id: "legend-region", label: "地区图例", role: "legend", group: "region-analysis", importance: 3, readingOrder: 9 },
    { id: "chart-progress", label: "入学准备完成度", role: "supporting-visualization", group: "progress-analysis", importance: 6, readingOrder: 10 },
    { id: "dashboard-note", label: "Dashboard 说明", role: "annotation", group: "overview", importance: 3, readingOrder: 11 },
  ];

  window.dashboardModules = dashboardModules;

  if (!d3Api) {
    document.querySelectorAll(".dashboard-error").forEach((errorElement) => {
      errorElement.hidden = false;
      errorElement.textContent = "D3.js 加载失败。请确认浏览器可以访问 CDN，然后重新打开页面。";
    });
    return;
  }

  const tooltip = d3Api
    .select("body")
    .append("div")
    .attr("id", "dashboard-tooltip")
    .attr("class", "dashboard-tooltip")
    .attr("role", "tooltip")
    .attr("hidden", true);

  const formatNumber = d3Api.format(",");
  const colorPalette = ["#c7d4e5", "#d8e1ec", "#b8c9de", "#e0e7ef", "#c3d1e3", "#d2ddea", "#b2c5dc", "#e5eaf0"];
  const localized = (value) => window.siteI18n?.translate(value) || value;
  const message = (zh, en) => (window.siteI18n?.isEnglish ? en : zh);

  const instances = [...document.querySelectorAll(".dashboard-shell")].map((root, index) => {
    if (!root.dataset.dashboardInstance) root.dataset.dashboardInstance = index === 0 ? "initial" : `dashboard-${index + 1}`;
    return { root, state: { region: "all", majorGroup: "all" }, resizeTimer: null };
  });
  let dashboardData = null;

  function getInstanceElement(instance, selector, fallbackId) {
    return instance.root.querySelector(selector) || (fallbackId ? instance.root.querySelector(`#${fallbackId}`) : null);
  }

  function getGroupLabel(instance, groupId) {
    const group = dashboardData.majorGroups.find((item) => item.id === groupId);
    return group ? localized(group.label) : groupId;
  }

  function getFilteredMajors(instance) {
    return dashboardData.majors.filter((major) => instance.state.majorGroup === "all" || major.group === instance.state.majorGroup);
  }

  function getFilteredRows(instance) {
    return dashboardData.heatmap.filter((row) => instance.state.region === "all" || row.region === instance.state.region);
  }

  function getFilteredColumns(instance) {
    return dashboardData.majorGroups.filter((group) => instance.state.majorGroup === "all" || group.id === instance.state.majorGroup);
  }

  function showTooltip(event, title, lines) {
    tooltip
      .attr("hidden", null)
      .html(`<strong>${title}</strong>${lines.map((line) => `<span>${line}</span>`).join("")}`);

    const node = tooltip.node();
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const left = Math.min(event.clientX + 14, window.innerWidth - width - 12);
    const top = Math.min(event.clientY + 14, window.innerHeight - height - 12);
    tooltip.style("left", `${Math.max(12, left)}px`).style("top", `${Math.max(12, top)}px`);
  }

  function hideTooltip() {
    tooltip.attr("hidden", true);
  }

  function getChartWidth(container) {
    return Math.max(0, Math.floor(container.getBoundingClientRect().width));
  }

  function renderTreemap(instance) {
    const container = getInstanceElement(instance, '[data-dashboard-chart="treemap"]', "major-treemap");
    if (!container) return;
    const width = getChartWidth(container);
    if (!width) return;

    container.replaceChildren();
    const items = getFilteredMajors(instance);
    const height = Math.max(220, Math.min(330, width * 0.64));
    const root = d3Api
      .hierarchy({ children: items })
      .sum((item) => item.students)
      .sort((a, b) => b.value - a.value);

    d3Api.treemap().size([width, height]).paddingInner(4).round(true)(root);

    const svg = d3Api
      .select(container)
      .append("svg")
      .attr("class", "dashboard-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "各专业新生人数 Treemap");

    const color = d3Api.scaleOrdinal().domain(items.map((item) => item.name)).range(colorPalette);
    const cells = svg
      .selectAll("g")
      .data(root.leaves(), (item) => item.data.name)
      .join("g")
      .attr("transform", (item) => `translate(${item.x0},${item.y0})`)
      .on("pointermove", (event, item) => {
        showTooltip(event, localized(item.data.name), [
          message(`人数：${formatNumber(item.data.students)}`, `Students: ${formatNumber(item.data.students)}`),
          message(`占比：${d3Api.format(".1%")((item.data.students || 0) / root.value)}`, `Share: ${d3Api.format(".1%")((item.data.students || 0) / root.value)}`),
        ]);
      })
      .on("pointerleave", hideTooltip);

    cells
      .append("rect")
      .attr("class", "treemap-cell")
      .attr("width", (item) => Math.max(0, item.x1 - item.x0))
      .attr("height", (item) => Math.max(0, item.y1 - item.y0))
      .attr("fill", (item) => color(item.data.name));

    cells
      .filter((item) => item.x1 - item.x0 > 56 && item.y1 - item.y0 > 38)
      .append("text")
      .attr("class", "treemap-label")
      .attr("x", 8)
      .attr("y", 18)
      .text((item) => localized(item.data.shortName));

    cells
      .filter((item) => item.x1 - item.x0 > 56 && item.y1 - item.y0 > 38)
      .append("text")
      .attr("class", "treemap-value")
      .attr("x", 8)
      .attr("y", 34)
      .text((item) => formatNumber(item.data.students));
  }

  function renderLegend(instance, maximum) {
    const legendScale = getInstanceElement(instance, "[data-dashboard-legend-scale]", "region-legend-scale");
    const legendMax = getInstanceElement(instance, "[data-dashboard-legend-max]", "legend-max");
    if (legendScale) legendScale.style.background = "linear-gradient(to top, #edf1f7, #9aacc9, #4a659a)";
    if (legendMax) legendMax.textContent = formatNumber(maximum);
  }

  function renderHeatmap(instance) {
    const container = getInstanceElement(instance, '[data-dashboard-chart="heatmap"]', "region-heatmap");
    if (!container) return;
    const width = getChartWidth(container);
    if (!width) return;

    container.replaceChildren();
    const rows = getFilteredRows(instance);
    const columns = getFilteredColumns(instance);
    const margin = { top: 34, right: 10, bottom: 20, left: width < 420 ? 52 : 66 };
    const cellWidth = Math.max(24, (width - margin.left - margin.right) / Math.max(1, columns.length));
    const cellHeight = width < 420 ? 34 : 38;
    const height = margin.top + margin.bottom + rows.length * cellHeight;
    const values = rows.flatMap((row) => columns.map((column) => row.values[column.id]));
    const maximum = d3Api.max(values) || 1;
    const color = d3Api.scaleLinear().domain([0, maximum]).range(["#edf1f7", "#4a659a"]);

    const svg = d3Api
      .select(container)
      .append("svg")
      .attr("class", "dashboard-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "地区与专业大类人数 Heatmap");

    svg
      .selectAll("text.column-label")
      .data(columns)
      .join("text")
      .attr("class", "column-label")
      .attr("x", (_, index) => margin.left + index * cellWidth + cellWidth / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .text((column) => localized(column.label));

    svg
      .selectAll("text.row-label")
      .data(rows)
      .join("text")
      .attr("class", "row-label")
      .attr("x", margin.left - 10)
      .attr("y", (_, index) => margin.top + index * cellHeight + cellHeight / 2 + 4)
      .attr("text-anchor", "end")
      .text((row) => localized(row.region));

    const cells = rows.flatMap((row) =>
      columns.map((column) => ({
        region: row.region,
        group: localized(column.label),
        value: row.values[column.id],
        columnId: column.id,
      })),
    );

    svg
      .selectAll("rect.heatmap-cell")
      .data(cells)
      .join("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (item) => margin.left + columns.findIndex((column) => column.id === item.columnId) * cellWidth)
      .attr("y", (item) => margin.top + rows.findIndex((row) => row.region === item.region) * cellHeight)
      .attr("width", Math.max(0, cellWidth - 2))
      .attr("height", Math.max(0, cellHeight - 2))
      .attr("fill", (item) => color(item.value))
      .on("pointermove", (event, item) => {
        showTooltip(event, `${localized(item.region)} · ${item.group}`, [message(`人数：${formatNumber(item.value)}`, `Students: ${formatNumber(item.value)}`)]);
      })
      .on("pointerleave", hideTooltip);

    renderLegend(instance, maximum);
  }

  function renderDotPlot(instance) {
    const container = getInstanceElement(instance, '[data-dashboard-chart="dotplot"]', "progress-dotplot");
    if (!container) return;
    const width = getChartWidth(container);
    if (!width) return;

    container.replaceChildren();
    const items = [...getFilteredMajors(instance)].sort((a, b) => a.completion - b.completion);
    const margin = { top: 12, right: 12, bottom: 30, left: width < 420 ? 76 : 112 };
    const rowHeight = width < 420 ? 31 : 34;
    const height = margin.top + margin.bottom + items.length * rowHeight;
    const x = d3Api.scaleLinear().domain([88, 100]).range([margin.left, width - margin.right]);
    const y = d3Api
      .scaleBand()
      .domain(items.map((item) => item.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.45);

    const svg = d3Api
      .select(container)
      .append("svg")
      .attr("class", "dashboard-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "各专业入学准备完成度 Dot Plot");

    [88, 92, 96, 100].forEach((tick) => {
      svg
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", x(tick))
        .attr("x2", x(tick))
        .attr("y1", margin.top - 4)
        .attr("y2", height - margin.bottom + 2);
    });

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom + 2})`)
      .call(d3Api.axisBottom(x).tickValues([88, 92, 96, 100]).tickFormat((value) => `${value}%`).tickSize(0))
      .call((axis) => axis.select("path").attr("class", "axis-line"));

    const rows = svg
      .selectAll("g.dot-row")
      .data(items, (item) => item.name)
      .join("g")
      .attr("class", "dot-row")
      .attr("transform", (item) => `translate(0,${y(item.name) + y.bandwidth() / 2})`)
      .on("pointermove", (event, item) => {
        showTooltip(event, localized(item.name), [message(`完成度：${item.completion.toFixed(1)}%`, `Completion: ${item.completion.toFixed(1)}%`)]);
      })
      .on("pointerleave", hideTooltip);

    rows
      .append("text")
      .attr("x", margin.left - 10)
      .attr("y", 4)
      .attr("text-anchor", "end")
      .text((item) => localized(item.shortName));

    rows
      .append("line")
      .attr("class", "dot-guide")
      .attr("x1", x(88))
      .attr("x2", (item) => x(item.completion))
      .attr("y1", 0)
      .attr("y2", 0);

    rows
      .append("circle")
      .attr("class", "dot-mark")
      .attr("cx", (item) => x(item.completion))
      .attr("cy", 0)
      .attr("r", 5);
  }

  function renderKpis(instance) {
    const rows = getFilteredRows(instance);
    const columns = getFilteredColumns(instance);
    const filteredTotal = rows.reduce(
      (sum, row) => sum + columns.reduce((rowSum, column) => rowSum + row.values[column.id], 0),
      0,
    );
    const majors = getFilteredMajors(instance);
    const studentsTotal = majors.reduce((sum, major) => sum + major.students, 0);
    const weightedRate = studentsTotal ? majors.reduce((sum, major) => sum + major.students * major.completion, 0) / studentsTotal : 0;
    const metric = (name, fallbackId) => getInstanceElement(instance, `[data-dashboard-metric="${name}"]`, fallbackId);
    const note = (name, fallbackId) => getInstanceElement(instance, `[data-dashboard-metric-note="${name}"]`, fallbackId);

    metric("total", "metric-total").textContent = formatNumber(filteredTotal);
    note("total", "metric-total-note").textContent = instance.state.region === "all" ? "All regions" : message(`${instance.state.region} selected`, `${localized(instance.state.region)} selected`);
    metric("major", "metric-major").textContent = String(majors.length);
    metric("region", "metric-region").textContent = String(instance.state.region === "all" ? dashboardData.kpis.regionCount : 1);
    note("region", "metric-region-note").textContent = instance.state.region === "all" ? "regions represented" : message("已选地区", "selected region");
    metric("checkin", "metric-checkin").textContent = `${(instance.state.majorGroup === "all" ? dashboardData.kpis.checkInRate : weightedRate).toFixed(1)}%`;
  }

  function updateFilterStatus(instance) {
    const status = getInstanceElement(instance, "[data-dashboard-filter-status]", "dashboard-filter-status");
    if (!status) return;
    const regionLabel = instance.state.region === "all" ? message("全部地区", "All regions") : localized(instance.state.region);
    const groupLabel = instance.state.majorGroup === "all" ? message("全部专业大类", "All major groups") : getGroupLabel(instance, instance.state.majorGroup);
    status.textContent = message(`当前视图：${regionLabel} · ${groupLabel}`, `Current view: ${regionLabel} · ${groupLabel}`);
  }

  function renderDashboard(instance) {
    if (!dashboardData) return;
    renderKpis(instance);
    renderTreemap(instance);
    renderHeatmap(instance);
    renderDotPlot(instance);
    updateFilterStatus(instance);
  }

  window.addEventListener("site:language-change", () => instances.forEach(renderDashboard));

  function bindFilters(instance) {
    const filters = instance.root.querySelector(".dashboard-filters");
    if (!filters) return;
    filters.addEventListener("change", (event) => {
      if (!(event.target instanceof HTMLSelectElement)) return;
      instance.state[event.target.name] = event.target.value;
      renderDashboard(instance);
    });
  }

  function scheduleResize(instance) {
    window.clearTimeout(instance.resizeTimer);
    instance.resizeTimer = window.setTimeout(() => renderDashboard(instance), 180);
  }

  async function loadDashboard() {
    try {
      const response = await fetch("data/freshman-dashboard.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      dashboardData = await response.json();
      instances.forEach((instance) => {
        bindFilters(instance);
        renderDashboard(instance);
        const dashboardCanvas = instance.root.closest(".dashboard-canvas") || instance.root;
        if (window.ResizeObserver) {
          const observer = new ResizeObserver(() => scheduleResize(instance));
          observer.observe(dashboardCanvas);
        }
      });
      window.dashboardReady = true;
      window.dashboardInstances = instances;
      window.dispatchEvent(new CustomEvent("dashboard:ready"));
      if (!window.ResizeObserver) window.addEventListener("resize", () => instances.forEach(scheduleResize));
    } catch (error) {
      instances.forEach((instance) => {
        const errorElement = instance.root.querySelector(".dashboard-error");
        if (!errorElement) return;
        errorElement.hidden = false;
        errorElement.textContent = "示例数据暂时无法加载，请确认通过 Live Server 打开页面。";
      });
    }
  }

  loadDashboard();
})();
