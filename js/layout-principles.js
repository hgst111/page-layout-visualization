(() => {
  const d3Api = window.d3;
  const alignmentSvg = document.getElementById("alignment-plot");
  const spacingSequenceSvg = document.getElementById("spacing-sequence");
  const spacingGapSvg = document.getElementById("spacing-gap-plot");
  const balanceSvg = document.getElementById("balance-field");
  const constraintSvg = document.getElementById("constraint-phase-diagram");

  if (!d3Api || !alignmentSvg || !spacingSequenceSvg || !spacingGapSvg) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const alignmentAxes = [
    { id: "A", label: "Axis A", position: 20 },
    { id: "B", label: "Axis B", position: 50 },
    { id: "C", label: "Axis C", position: 80 },
  ];
  const alignmentElements = [
    { id: 1, group: "A", targetAxis: 20, noise: -0.72 },
    { id: 2, group: "A", targetAxis: 20, noise: 0.24 },
    { id: 3, group: "A", targetAxis: 20, noise: -0.4 },
    { id: 4, group: "A", targetAxis: 20, noise: 0.56 },
    { id: 5, group: "B", targetAxis: 50, noise: -0.48 },
    { id: 6, group: "B", targetAxis: 50, noise: 0.68 },
    { id: 7, group: "B", targetAxis: 50, noise: -0.2 },
    { id: 8, group: "B", targetAxis: 50, noise: 0.42 },
    { id: 9, group: "C", targetAxis: 80, noise: -0.62 },
    { id: 10, group: "C", targetAxis: 80, noise: 0.32 },
    { id: 11, group: "C", targetAxis: 80, noise: -0.36 },
    { id: 12, group: "C", targetAxis: 80, noise: 0.7 },
  ];
  const spacingScale = [8, 16, 24, 32];
  const irregularGaps = [11, 27, 18, 35, 13, 22, 29];
  const systematicGaps = [8, 24, 8, 32, 8, 24, 8];
  const balancePresets = {
    symmetric: [
      { id: "A", x: 0.22, y: 0.25, weight: 3 },
      { id: "B", x: 0.78, y: 0.25, weight: 3 },
      { id: "C", x: 0.22, y: 0.75, weight: 3 },
      { id: "D", x: 0.78, y: 0.75, weight: 3 },
      { id: "E", x: 0.38, y: 0.5, weight: 1 },
      { id: "F", x: 0.62, y: 0.5, weight: 1 },
    ],
    balanced: [
      { id: "A", x: 0.69, y: 0.28, weight: 2 },
      { id: "B", x: 0.82, y: 0.43, weight: 2 },
      { id: "C", x: 0.33, y: 0.56, weight: 6 },
      { id: "D", x: 0.66, y: 0.74, weight: 2 },
      { id: "E", x: 0.18, y: 0.22, weight: 1 },
      { id: "F", x: 0.5, y: 0.83, weight: 1 },
    ],
    unbalanced: [
      { id: "A", x: 0.72, y: 0.26, weight: 6 },
      { id: "B", x: 0.83, y: 0.36, weight: 2 },
      { id: "C", x: 0.66, y: 0.5, weight: 2 },
      { id: "D", x: 0.78, y: 0.66, weight: 2 },
      { id: "E", x: 0.56, y: 0.22, weight: 1 },
      { id: "F", x: 0.68, y: 0.8, weight: 1 },
    ],
  };
  const constraintGap = 24;
  const constraintDomain = {
    available: [360, 1440],
    minimum: [180, 420],
  };
  const constraintPresets = {
    spacious: { availableWidth: 1280, minimumWidth: 240 },
    tight: { availableWidth: 700, minimumWidth: 260 },
    dense: { availableWidth: 1000, minimumWidth: 380 },
  };
  const alignmentState = { noise: 8, showDeviations: true };
  const spacingState = { consistency: 0 };
  const balanceState = {
    preset: "balanced",
    marks: balancePresets.balanced.map((mark) => ({ ...mark })),
    selectedId: "C",
    showTrail: true,
    trail: [],
  };
  const constraintState = {
    availableWidth: 900,
    minimumWidth: 280,
    preset: null,
    previousColumns: null,
    lastChange: "INITIAL",
    lastCause: null,
    dragReflowed: false,
    selectedBoundary: 3,
  };

  const alignmentNoise = document.getElementById("alignment-noise");
  const alignmentNoiseValue = document.getElementById("alignment-noise-value");
  const alignmentDeviations = document.getElementById("alignment-deviations");
  const alignmentMean = document.getElementById("alignment-mean-deviation");
  const alignmentInsight = document.getElementById("alignment-insight");
  const spacingConsistency = document.getElementById("spacing-consistency");
  const spacingConsistencyValue = document.getElementById("spacing-consistency-value");
  const spacingUniqueValues = document.getElementById("spacing-unique-values");
  const spacingScaleDistance = document.getElementById("spacing-scale-distance");
  const spacingInsight = document.getElementById("spacing-insight");
  const balanceStateLabel = document.getElementById("balance-state");
  const balanceSelectedMark = document.getElementById("balance-selected-mark");
  const balanceSelectedWeight = document.getElementById("balance-selected-weight");
  const balanceWeight = document.getElementById("balance-weight");
  const balanceWeightValue = document.getElementById("balance-weight-value");
  const balanceTrail = document.getElementById("balance-trail");
  const balanceVisualCenter = document.getElementById("balance-visual-center");
  const balanceOffset = document.getElementById("balance-offset");
  const balanceTotalWeight = document.getElementById("balance-total-weight");
  const balanceInsight = document.getElementById("balance-insight");
  const constraintStageStatus = document.getElementById("constraint-stage-status");
  const constraintAvailableWidth = document.getElementById("constraint-available-width");
  const constraintAvailableWidthValue = document.getElementById("constraint-available-width-value");
  const constraintMinimumWidth = document.getElementById("constraint-minimum-width");
  const constraintMinimumWidthValue = document.getElementById("constraint-minimum-width-value");
  const constraintCurrentLayout = document.getElementById("constraint-current-layout");
  const constraintLastChange = document.getElementById("constraint-last-change");
  const constraintBoundaryTitle = document.getElementById("constraint-boundary-title");
  const constraintBoundaryCopy = document.getElementById("constraint-boundary-copy");
  const constraintInsight = document.getElementById("constraint-insight");

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const formatValue = (value) => Number(value).toFixed(1);
  const motionDuration = (duration) => (reducedMotion.matches ? 0 : duration);

  function transition(selection, duration, update) {
    selection.interrupt();
    if (!duration) return update(selection);
    update(selection.transition().duration(motionDuration(duration)).ease(d3Api.easeCubicOut));
  }

  function alignmentData() {
    return alignmentElements.map((element) => ({
      ...element,
      actualX: clamp(element.targetAxis + element.noise * alignmentState.noise, 3, 97),
    }));
  }

  function updateAlignmentCopy(data) {
    const meanDeviation = d3Api.mean(data, (element) => Math.abs(element.actualX - element.targetAxis));
    alignmentNoiseValue.textContent = `${alignmentState.noise} units`;
    alignmentMean.textContent = `${formatValue(meanDeviation)} units`;

    if (alignmentState.noise === 0) {
      alignmentInsight.textContent = "多个元素共享有限的对齐轴，结构更稳定。";
    } else if (alignmentState.noise <= 10) {
      alignmentInsight.textContent = "元素仍大致形成三组，但共同边界开始变得模糊。";
    } else {
      alignmentInsight.textContent = "接近但不一致的边界增加了空间噪声。";
    }
  }

  function drawAlignment(duration = 0) {
    const container = alignmentSvg.parentElement;
    const width = Math.max(280, Math.round(container.getBoundingClientRect().width));
    const height = width < 420 ? 338 : 380;
    const margin = { top: 38, right: 18, bottom: 48, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = d3Api.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
    const y = d3Api.scalePoint().domain(alignmentElements.map((element) => element.id)).range([margin.top, height - margin.bottom]).padding(0.8);
    const data = alignmentData();
    const svg = d3Api.select(alignmentSvg);

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const grid = svg.selectAll("g.alignment-grid").data([null]).join("g").attr("class", "alignment-grid");
    const xAxis = svg.selectAll("g.alignment-axis-x").data([null]).join("g").attr("class", "alignment-axis-x");
    const yAxis = svg.selectAll("g.alignment-axis-y").data([null]).join("g").attr("class", "alignment-axis-y");
    const axisGroup = svg.selectAll("g.alignment-reference-axes").data([null]).join("g").attr("class", "alignment-reference-axes");
    const deviationGroup = svg.selectAll("g.alignment-deviations").data([null]).join("g").attr("class", "alignment-deviations");
    const markGroup = svg.selectAll("g.alignment-marks").data([null]).join("g").attr("class", "alignment-marks");

    grid.call(d3Api.axisLeft(y).tickSize(-plotWidth).tickFormat(() => ""));
    grid.attr("transform", `translate(${margin.left},0)`);
    xAxis.call(d3Api.axisBottom(x).ticks(width < 420 ? 4 : 5).tickSizeOuter(0));
    xAxis.attr("transform", `translate(0,${height - margin.bottom})`);
    yAxis.call(d3Api.axisLeft(y).tickSizeOuter(0).tickFormat((id) => `E${id}`));
    yAxis.attr("transform", `translate(${margin.left},0)`);

    const axes = axisGroup.selectAll("g.alignment-axis").data(alignmentAxes, (axis) => axis.id).join((enter) => {
      const group = enter.append("g").attr("class", "alignment-axis");
      group.append("line");
      group.append("text");
      return group;
    });
    axes.attr("transform", (axis) => `translate(${x(axis.position)},0)`);
    axes.select("line").attr("y1", margin.top - 18).attr("y2", height - margin.bottom).attr("x1", 0).attr("x2", 0);
    axes.select("text").attr("y", margin.top - 22).attr("text-anchor", "middle").text((axis) => axis.label);

    const deviations = deviationGroup.selectAll("line.alignment-deviation").data(data, (element) => element.id).join("line").attr("class", "alignment-deviation");
    deviations.attr("display", alignmentState.showDeviations ? null : "none");
    transition(deviations, duration, (selection) => selection
      .attr("x1", (element) => x(element.targetAxis))
      .attr("x2", (element) => x(element.actualX))
      .attr("y1", (element) => y(element.id))
      .attr("y2", (element) => y(element.id)));

    const marks = markGroup.selectAll("circle.alignment-mark").data(data, (element) => element.id).join("circle").attr("class", "alignment-mark");
    marks
      .attr("r", 5)
      .attr("data-tooltip", (element) => `Element ${element.id} · Axis ${element.group} · ${formatValue(Math.abs(element.actualX - element.targetAxis))} units deviation`)
      .attr("aria-label", (element) => `Element ${element.id}, Axis ${element.group}, ${formatValue(Math.abs(element.actualX - element.targetAxis))} units deviation`);
    transition(marks, duration, (selection) => selection.attr("cx", (element) => x(element.actualX)).attr("cy", (element) => y(element.id)));

    const axisTitles = svg.selectAll("text.alignment-axis-title").data([null]).join("text").attr("class", "alignment-axis-title");
    axisTitles.attr("x", width / 2).attr("y", height - 8).attr("data-axis", "x").attr("text-anchor", "middle").text("Horizontal position / units");
    const yTitle = svg.selectAll("text.alignment-y-title").data([null]).join("text").attr("class", "alignment-axis-title alignment-y-title");
    yTitle.attr("x", 14).attr("y", height / 2).attr("data-axis", "y").attr("text-anchor", "middle").attr("transform", `rotate(-90 14 ${height / 2})`).text("Element");

    updateAlignmentCopy(data);
  }

  function currentSpacingGaps() {
    const alpha = spacingState.consistency / 100;
    return irregularGaps.map((gap, index) => (1 - alpha) * gap + alpha * systematicGaps[index]);
  }

  function updateSpacingCopy(gaps) {
    const unique = new Set(gaps.map((gap) => formatValue(gap))).size;
    const meanDistance = d3Api.mean(gaps, (gap) => Math.min(...spacingScale.map((value) => Math.abs(gap - value))));
    spacingConsistencyValue.textContent = `${spacingState.consistency}%`;
    spacingUniqueValues.textContent = String(unique);
    spacingScaleDistance.textContent = `${formatValue(meanDistance)} units`;

    if (spacingState.consistency < 34) {
      spacingInsight.textContent = "每个间距都像一次独立决定，页面很难形成稳定节奏。";
    } else if (spacingState.consistency < 76) {
      spacingInsight.textContent = "间距开始围绕有限尺度聚集，但仍存在局部差异。";
    } else {
      spacingInsight.textContent = "有限、重复的间距尺度建立了更清晰的空间节奏。统一节奏不等于所有 gap 相同。";
    }
  }

  function drawSpacingSequence(gaps, duration = 0) {
    const container = spacingSequenceSvg.parentElement;
    const width = Math.max(280, Math.round(container.getBoundingClientRect().width));
    const height = 128;
    const blockCount = gaps.length + 1;
    const blockWidth = clamp(width / 16, 22, 46);
    const usableWidth = Math.max(40, width - blockCount * blockWidth - 24);
    const gapScale = usableWidth / d3Api.sum(gaps);
    let cursor = 12;
    const blocks = Array.from({ length: blockCount }, (_, index) => {
      const block = { index, x: cursor };
      cursor += blockWidth;
      if (index < gaps.length) cursor += gaps[index] * gapScale;
      return block;
    });
    const gapMarks = gaps.map((gap, index) => ({
      index,
      value: gap,
      x: blocks[index].x + blockWidth + (blocks[index + 1].x - (blocks[index].x + blockWidth)) / 2,
    }));
    const svg = d3Api.select(spacingSequenceSvg);
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const blockGroup = svg.selectAll("g.spacing-blocks").data([null]).join("g").attr("class", "spacing-blocks");
    const gapGroup = svg.selectAll("g.spacing-gap-labels").data([null]).join("g").attr("class", "spacing-gap-labels");
    const blockSelection = blockGroup.selectAll("g.spacing-block").data(blocks, (block) => block.index).join((enter) => {
      const group = enter.append("g").attr("class", "spacing-block");
      group.append("rect");
      group.append("text");
      return group;
    });
    blockSelection.select("rect").attr("width", blockWidth).attr("height", 38).attr("y", 30);
    transition(blockSelection, duration, (selection) => selection.attr("transform", (block) => `translate(${block.x},0)`));
    blockSelection.select("text").attr("x", blockWidth / 2).attr("y", 53).attr("text-anchor", "middle").text((block) => String(block.index + 1).padStart(2, "0"));

    const gapSelection = gapGroup.selectAll("g.spacing-gap-label").data(gapMarks, (gap) => gap.index).join((enter) => {
      const group = enter.append("g").attr("class", "spacing-gap-label");
      group.append("line");
      group.append("text");
      return group;
    });
    transition(gapSelection, duration, (selection) => selection.attr("transform", (gap) => `translate(${gap.x},0)`));
    gapSelection.select("line").attr("y1", 76).attr("y2", 83);
    gapSelection.select("text").attr("y", 101).attr("text-anchor", "middle").text((gap) => Math.round(gap.value));
    svg.selectAll("text.spacing-sequence-caption").data([null]).join("text").attr("class", "spacing-sequence-caption").attr("x", 12).attr("y", 119).text("block sequence · gap values");
  }

  function drawSpacingGapPlot(gaps, duration = 0) {
    const container = spacingGapSvg.parentElement;
    const width = Math.max(280, Math.round(container.getBoundingClientRect().width));
    const height = width < 420 ? 218 : 238;
    const margin = { top: 20, right: 18, bottom: 45, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = d3Api.scalePoint().domain(gaps.map((_, index) => index + 1)).range([margin.left, width - margin.right]).padding(0.45);
    const y = d3Api.scaleLinear().domain([0, 40]).range([height - margin.bottom, margin.top]);
    const svg = d3Api.select(spacingGapSvg);
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const grid = svg.selectAll("g.spacing-scale-levels").data([null]).join("g").attr("class", "spacing-scale-levels");
    const xAxis = svg.selectAll("g.spacing-axis-x").data([null]).join("g").attr("class", "spacing-axis-x");
    const yAxis = svg.selectAll("g.spacing-axis-y").data([null]).join("g").attr("class", "spacing-axis-y");
    grid.selectAll("g.spacing-scale-level").data(spacingScale, (level) => level).join((enter) => {
      const group = enter.append("g").attr("class", "spacing-scale-level");
      group.append("line");
      group.append("text");
      return group;
    }).attr("transform", (level) => `translate(0,${y(level)})`).each(function (level) {
      const group = d3Api.select(this);
      group.select("line").attr("x1", margin.left).attr("x2", width - margin.right);
      group.select("text").attr("x", margin.left - 8).attr("y", 4).attr("text-anchor", "end").text(level);
    });
    xAxis.call(d3Api.axisBottom(x).tickFormat((index) => `G${index}`).tickSizeOuter(0));
    xAxis.attr("transform", `translate(0,${height - margin.bottom})`);
    yAxis.call(d3Api.axisLeft(y).tickValues([0, 8, 16, 24, 32, 40]).tickSizeOuter(0));
    yAxis.attr("transform", `translate(${margin.left},0)`);

    const stems = svg.selectAll("g.spacing-stems").data([null]).join("g").attr("class", "spacing-stems");
    const points = svg.selectAll("g.spacing-points").data([null]).join("g").attr("class", "spacing-points");
    const stemSelection = stems.selectAll("line.spacing-stem").data(gaps.map((value, index) => ({ value, index })), (gap) => gap.index).join("line").attr("class", "spacing-stem");
    transition(stemSelection, duration, (selection) => selection.attr("x1", (gap) => x(gap.index + 1)).attr("x2", (gap) => x(gap.index + 1)).attr("y1", y(0)).attr("y2", (gap) => y(gap.value)));
    const pointSelection = points.selectAll("circle.spacing-point").data(gaps.map((value, index) => ({ value, index })), (gap) => gap.index).join("circle").attr("class", "spacing-point");
    pointSelection.attr("r", 5).attr("data-tooltip", (gap) => `Gap ${gap.index + 1} · ${formatValue(gap.value)} units`);
    transition(pointSelection, duration, (selection) => selection.attr("cx", (gap) => x(gap.index + 1)).attr("cy", (gap) => y(gap.value)));

    const xTitle = svg.selectAll("text.spacing-x-title").data([null]).join("text").attr("class", "spacing-axis-title spacing-x-title");
    xTitle.attr("x", width / 2).attr("y", height - 8).attr("data-axis", "x").attr("text-anchor", "middle").text("Gap index");
    const yTitle = svg.selectAll("text.spacing-y-title").data([null]).join("text").attr("class", "spacing-axis-title spacing-y-title");
    yTitle.attr("x", 14).attr("y", height / 2).attr("data-axis", "y").attr("text-anchor", "middle").attr("transform", `rotate(-90 14 ${height / 2})`).text("Gap size / units");
  }

  function drawSpacing(duration = 0) {
    const gaps = currentSpacingGaps();
    drawSpacingSequence(gaps, duration);
    drawSpacingGapPlot(gaps, duration);
    updateSpacingCopy(gaps);
  }

  let constraintChart = null;

  function computeColumns(availableWidth, minimumWidth) {
    return Math.max(
      1,
      Math.min(
        4,
        Math.floor((Number(availableWidth) + constraintGap) / (Number(minimumWidth) + constraintGap)),
      ),
    );
  }

  function constraintBoundaryWidth(columns, minimumWidth) {
    return columns * Number(minimumWidth) + (columns - 1) * constraintGap;
  }

  function constraintRegionPath(columns, xScale, yScale) {
    const samples = d3Api.range(constraintDomain.minimum[0], constraintDomain.minimum[1] + 0.1, 4).map((minimumWidth) => ({
      minimumWidth,
      lower: columns === 1 ? constraintDomain.available[0] : constraintBoundaryWidth(columns, minimumWidth),
      upper: columns === 4 ? constraintDomain.available[1] : constraintBoundaryWidth(columns + 1, minimumWidth),
    }));
    return d3Api.area()
      .defined((point) => point.lower < constraintDomain.available[1] && point.upper > constraintDomain.available[0])
      .x0((point) => xScale(clamp(point.lower, constraintDomain.available[0], constraintDomain.available[1])))
      .x1((point) => xScale(clamp(point.upper, constraintDomain.available[0], constraintDomain.available[1])))
      .y((point) => yScale(point.minimumWidth))
      .curve(d3Api.curveLinear)(samples);
  }

  function constraintBoundaryPath(columns, xScale, yScale) {
    const samples = d3Api.range(constraintDomain.minimum[0], constraintDomain.minimum[1] + 0.1, 4)
      .map((minimumWidth) => ({ minimumWidth, availableWidth: constraintBoundaryWidth(columns, minimumWidth) }));
    return d3Api.line()
      .defined((point) => point.availableWidth >= constraintDomain.available[0] && point.availableWidth <= constraintDomain.available[1])
      .x((point) => xScale(point.availableWidth))
      .y((point) => yScale(point.minimumWidth))
      .curve(d3Api.curveLinear)(samples);
  }

  function updateConstraintBoundaryDetail(columns) {
    if (!constraintBoundaryTitle || !constraintBoundaryCopy) return;
    constraintState.selectedBoundary = columns;
    const requiredWidth = constraintBoundaryWidth(columns, constraintState.minimumWidth);
    constraintBoundaryTitle.textContent = `${columns}-column boundary`;
    constraintBoundaryCopy.textContent = `Requirement: W >= ${columns}M + ${columns - 1}G · At M = ${constraintState.minimumWidth}px, required width: ${requiredWidth}px.`;
  }

  function syncConstraintControls() {
    if (!constraintAvailableWidth || !constraintMinimumWidth) return;
    constraintAvailableWidth.value = String(constraintState.availableWidth);
    constraintMinimumWidth.value = String(constraintState.minimumWidth);
    constraintAvailableWidthValue.textContent = `${constraintState.availableWidth} px`;
    constraintMinimumWidthValue.textContent = `${constraintState.minimumWidth} px`;
    document.querySelectorAll("[data-constraint-preset]").forEach((button) => {
      const active = button.dataset.constraintPreset === constraintState.preset;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateConstraintInsight(columns, source, didReflow) {
    if (!constraintInsight) return;
    if (didReflow && constraintState.lastCause === "minimum") {
      constraintInsight.textContent = "内容对最小宽度的需求提高，即使 available width 不变，也可能触发重新布局。";
      return;
    }
    if (source === "minimum" && !didReflow) {
      constraintInsight.textContent = "Minimum readable width 正在变化，但当前列数仍然可行，因此这次只是 RESIZE。";
      return;
    }
    if (columns === 4) {
      constraintInsight.textContent = "当前空间足以让四个模块并列，同时满足最低可读宽度。";
    } else if (columns === 3) {
      constraintInsight.textContent = "当前空间可以容纳三列；继续维持四列会使模块低于最低可读宽度，因此布局需要减少列数。";
    } else if (columns === 2) {
      constraintInsight.textContent = "当前空间可以容纳两列；再增加一列会低于最低可读宽度，布局需要保留更宽的模块。";
    } else {
      constraintInsight.textContent = "当前空间只能容纳一列；模块需要保持最低可读宽度，布局因此转为单列。";
    }
  }

  function updateConstraintPoint({ animate = false, source = "input", recordChange = true } = {}) {
    if (!constraintChart) return;
    const columns = computeColumns(constraintState.availableWidth, constraintState.minimumWidth);
    const previousColumns = constraintState.previousColumns;
    const didReflow = recordChange && previousColumns !== null && previousColumns !== columns;

    if (recordChange) {
      const preserveDragReflow = source === "drag" && constraintState.dragReflowed && !didReflow;
      if (!preserveDragReflow) {
        constraintState.lastChange = previousColumns === null
          ? "INITIAL"
          : didReflow
            ? `REFLOW ${previousColumns} → ${columns} COLUMNS`
            : "RESIZE";
      }
    }
    constraintState.previousColumns = columns;
    if (didReflow && source === "drag") constraintState.dragReflowed = true;

    const pointX = constraintChart.xScale(constraintState.availableWidth);
    const pointY = constraintChart.yScale(constraintState.minimumWidth);
    const move = (selection) => {
      selection.interrupt();
      return animate
        ? selection.transition().duration(180).ease(d3Api.easeCubicOut)
        : selection;
    };

    move(constraintChart.horizontalGuide)
      .attr("x1", constraintChart.margin.left)
      .attr("x2", pointX)
      .attr("y1", pointY)
      .attr("y2", pointY);
    move(constraintChart.verticalGuide)
      .attr("x1", pointX)
      .attr("x2", pointX)
      .attr("y1", pointY)
      .attr("y2", constraintChart.height - constraintChart.margin.bottom);
    move(constraintChart.pointRing).attr("cx", pointX).attr("cy", pointY);
    move(constraintChart.point).attr("cx", pointX).attr("cy", pointY);

    const labelWidth = 138;
    const labelHeight = 38;
    const labelX = pointX > constraintChart.width * 0.68
      ? Math.max(constraintChart.margin.left + 4, pointX - labelWidth - 12)
      : Math.min(pointX + 12, constraintChart.width - constraintChart.margin.right - labelWidth - 4);
    const labelY = clamp(pointY - labelHeight - 12, constraintChart.margin.top + 4, constraintChart.height - constraintChart.margin.bottom - labelHeight - 4);
    constraintChart.pointLabel.attr("transform", `translate(${labelX},${labelY})`);
    constraintChart.pointLabel.select("text.constraint-point-values").text(`W = ${constraintState.availableWidth} · M = ${constraintState.minimumWidth}`);
    constraintChart.pointLabel.select("text.constraint-point-columns").text(`${columns} columns`);
    constraintChart.pointHit
      .attr("cx", pointX)
      .attr("cy", pointY)
      .attr("aria-label", `Current constraint point: available width ${constraintState.availableWidth} pixels, minimum readable width ${constraintState.minimumWidth} pixels, ${columns} columns`);

    const layoutLabel = `${columns} COLUMNS`;
    constraintCurrentLayout.textContent = layoutLabel;
    constraintStageStatus.textContent = layoutLabel;
    constraintLastChange.textContent = constraintState.lastChange;
    updateConstraintInsight(columns, source, didReflow);

    if (didReflow) {
      constraintChart.regions.classed("is-pulsing", false);
      const activeRegion = constraintChart.regions.filter((region) => region.columns === columns);
      activeRegion.classed("is-pulsing", true);
      window.setTimeout(() => activeRegion.classed("is-pulsing", false), 260);
    }
  }

  function setConstraintValues(availableWidth, minimumWidth, source = "input", preset = null) {
    const previousWidth = constraintState.availableWidth;
    const previousMinimum = constraintState.minimumWidth;
    constraintState.availableWidth = Math.round(clamp(availableWidth, constraintDomain.available[0], constraintDomain.available[1]));
    constraintState.minimumWidth = Math.round(clamp(minimumWidth, constraintDomain.minimum[0], constraintDomain.minimum[1]));
    constraintState.preset = preset;
    constraintState.lastCause = preset === "dense"
      ? "minimum"
      : constraintState.minimumWidth > previousMinimum && constraintState.availableWidth === previousWidth
        ? "minimum"
        : source;
    syncConstraintControls();
    updateConstraintBoundaryDetail(constraintState.selectedBoundary);
    updateConstraintPoint({ animate: source === "preset", source });
  }

  function renderConstraintDiagram() {
    if (!constraintSvg) return;
    const container = constraintSvg.parentElement;
    const width = Math.max(280, Math.round(container.getBoundingClientRect().width));
    const height = width < 460 ? 350 : 470;
    const margin = width < 420
      ? { top: 22, right: 12, bottom: 58, left: 68 }
      : { top: 28, right: 22, bottom: 62, left: 78 };
    const xScale = d3Api.scaleLinear().domain(constraintDomain.available).range([margin.left, width - margin.right]);
    const yScale = d3Api.scaleLinear().domain(constraintDomain.minimum).range([height - margin.bottom, margin.top]);
    const svg = d3Api.select(constraintSvg).attr("viewBox", `0 0 ${width} ${height}`);
    const defs = svg.selectAll("defs.constraint-defs").data([null]).join("defs").attr("class", "constraint-defs");
    const clip = defs.selectAll("clipPath#constraint-plot-clip").data([null]).join("clipPath").attr("id", "constraint-plot-clip");
    clip.selectAll("rect").data([null]).join("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    svg.selectAll("rect.constraint-plot-surface").data([null]).join("rect")
      .attr("class", "constraint-plot-surface")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    const regionData = [1, 2, 3, 4].map((columns) => ({ columns }));
    const regionGroup = svg.selectAll("g.constraint-regions").data([null]).join("g")
      .attr("class", "constraint-regions")
      .attr("clip-path", "url(#constraint-plot-clip)");
    const regions = regionGroup.selectAll("path.constraint-region").data(regionData, (region) => region.columns).join("path")
      .attr("class", (region) => `constraint-region constraint-region--${region.columns}`)
      .attr("aria-label", (region) => `${region.columns} column feasible region`)
      .attr("d", (region) => constraintRegionPath(region.columns, xScale, yScale));

    const boundaryData = [2, 3, 4].map((columns) => ({ columns }));
    const boundaryGroup = svg.selectAll("g.constraint-boundaries").data([null]).join("g")
      .attr("class", "constraint-boundaries")
      .attr("clip-path", "url(#constraint-plot-clip)");
    boundaryGroup.selectAll("path.constraint-boundary").data(boundaryData, (boundary) => boundary.columns).join("path")
      .attr("class", "constraint-boundary")
      .attr("d", (boundary) => constraintBoundaryPath(boundary.columns, xScale, yScale));
    const boundaryHit = boundaryGroup.selectAll("path.constraint-boundary-hit").data(boundaryData, (boundary) => boundary.columns).join("path")
      .attr("class", "constraint-boundary-hit")
      .attr("d", (boundary) => constraintBoundaryPath(boundary.columns, xScale, yScale))
      .attr("data-tooltip", (boundary) => `${boundary.columns}-column boundary · W >= ${boundary.columns}M + ${boundary.columns - 1}G`)
      .attr("aria-label", (boundary) => `${boundary.columns}-column feasibility boundary`)
      .on("mouseenter", (_, boundary) => updateConstraintBoundaryDetail(boundary.columns))
      .on("click", (_, boundary) => updateConstraintBoundaryDetail(boundary.columns));

    const labelPositions = [
      { columns: 1, availableWidth: 470, minimumWidth: 320 },
      { columns: 2, availableWidth: 690, minimumWidth: 300 },
      { columns: 3, availableWidth: 900, minimumWidth: 235 },
      { columns: 4, availableWidth: 1180, minimumWidth: 220 },
    ];
    svg.selectAll("g.constraint-region-labels").data([null]).join("g")
      .attr("class", "constraint-region-labels")
      .selectAll("text.constraint-region-label")
      .data(labelPositions, (region) => region.columns)
      .join("text")
      .attr("class", "constraint-region-label")
      .attr("x", (region) => xScale(region.availableWidth))
      .attr("y", (region) => yScale(region.minimumWidth))
      .attr("text-anchor", "middle")
      .text((region) => `${region.columns} COLUMN${region.columns === 1 ? "" : "S"}`);

    const xAxis = svg.selectAll("g.constraint-axis-x").data([null]).join("g").attr("class", "constraint-axis-x");
    const yAxis = svg.selectAll("g.constraint-axis-y").data([null]).join("g").attr("class", "constraint-axis-y");
    xAxis.call(d3Api.axisBottom(xScale).ticks(width < 460 ? 4 : 6).tickFormat(d3Api.format("d")).tickSizeOuter(0));
    xAxis.attr("transform", `translate(0,${height - margin.bottom})`);
    yAxis.call(d3Api.axisLeft(yScale).ticks(width < 460 ? 4 : 5).tickFormat(d3Api.format("d")).tickSizeOuter(0));
    yAxis.attr("transform", `translate(${margin.left},0)`);
    svg.selectAll("text.constraint-axis-title-x").data([null]).join("text")
      .attr("class", "constraint-axis-title constraint-axis-title-x")
      .attr("data-axis", "x")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .text("Available width / px");
    svg.selectAll("text.constraint-axis-title-y").data([null]).join("text")
      .attr("class", "constraint-axis-title constraint-axis-title-y")
      .attr("data-axis", "y")
      .attr("x", 15)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90 15 ${height / 2})`)
      .text(width < 460 ? "Min readable width / px" : "Minimum readable module width / px");

    const guides = svg.selectAll("g.constraint-guides").data([null]).join("g").attr("class", "constraint-guides");
    const horizontalGuide = guides.selectAll("line.constraint-guide-horizontal").data([null]).join("line").attr("class", "constraint-guide constraint-guide-horizontal");
    const verticalGuide = guides.selectAll("line.constraint-guide-vertical").data([null]).join("line").attr("class", "constraint-guide constraint-guide-vertical");
    const pointLayer = svg.selectAll("g.constraint-current-point").data([null]).join("g").attr("class", "constraint-current-point");
    const pointRing = pointLayer.selectAll("circle.constraint-point-ring").data([null]).join("circle").attr("class", "constraint-point-ring").attr("r", 10);
    const point = pointLayer.selectAll("circle.constraint-point").data([null]).join("circle").attr("class", "constraint-point").attr("r", 6);
    const pointHit = pointLayer.selectAll("circle.constraint-point-hit").data([null]).join("circle").attr("class", "constraint-point-hit").attr("r", 15);
    const pointLabel = pointLayer.selectAll("g.constraint-point-label").data([null]).join("g").attr("class", "constraint-point-label");
    pointLabel.selectAll("rect").data([null]).join("rect").attr("width", 138).attr("height", 38).attr("rx", 2);
    pointLabel.selectAll("text.constraint-point-values").data([null]).join("text").attr("class", "constraint-point-values").attr("x", 8).attr("y", 15);
    pointLabel.selectAll("text.constraint-point-columns").data([null]).join("text").attr("class", "constraint-point-columns").attr("x", 8).attr("y", 30);

    const drag = d3Api.drag()
      .on("start", () => {
        constraintState.dragReflowed = false;
        pointHit.classed("is-dragging", true);
      })
      .on("drag", (event) => {
        const [pointerX, pointerY] = d3Api.pointer(event, constraintSvg);
        setConstraintValues(xScale.invert(pointerX), yScale.invert(pointerY), "drag");
      })
      .on("end", () => pointHit.classed("is-dragging", false));
    pointHit.call(drag);

    constraintChart = {
      width,
      height,
      margin,
      xScale,
      yScale,
      regions,
      horizontalGuide,
      verticalGuide,
      pointRing,
      point,
      pointHit,
      pointLabel,
    };
    updateConstraintPoint({ recordChange: false });
  }

  function initConstraintLab() {
    if (!constraintSvg || !constraintAvailableWidth || !constraintMinimumWidth) return;
    syncConstraintControls();
    renderConstraintDiagram();
    constraintAvailableWidth.addEventListener("input", (event) => setConstraintValues(event.target.value, constraintState.minimumWidth, "available"));
    constraintMinimumWidth.addEventListener("input", (event) => setConstraintValues(constraintState.availableWidth, event.target.value, "minimum"));
    document.querySelectorAll("[data-constraint-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = constraintPresets[button.dataset.constraintPreset];
        setConstraintValues(preset.availableWidth, preset.minimumWidth, "preset", button.dataset.constraintPreset);
      });
    });
    window.responsiveConstraintLab = {
      computeColumns,
      getState: () => ({
        availableWidth: constraintState.availableWidth,
        minimumWidth: constraintState.minimumWidth,
        columns: computeColumns(constraintState.availableWidth, constraintState.minimumWidth),
        lastChange: constraintState.lastChange,
      }),
    };
  }

  function computeVisualCenter() {
    const totalWeight = d3Api.sum(balanceState.marks, (mark) => mark.weight);
    return {
      x: d3Api.sum(balanceState.marks, (mark) => mark.weight * mark.x) / totalWeight,
      y: d3Api.sum(balanceState.marks, (mark) => mark.weight * mark.y) / totalWeight,
      totalWeight,
    };
  }

  function selectedBalanceMark() {
    return balanceState.marks.find((mark) => mark.id === balanceState.selectedId) || balanceState.marks[0];
  }

  function syncBalanceControls() {
    const selected = selectedBalanceMark();
    if (!selected) return;
    balanceSelectedMark.textContent = selected.id;
    balanceSelectedWeight.textContent = String(selected.weight);
    balanceWeightValue.textContent = String(selected.weight);
    balanceWeight.value = String(selected.weight);
    balanceStateLabel.textContent = {
      symmetric: "SYMMETRIC",
      balanced: "BALANCED ASYMMETRIC",
      unbalanced: "UNBALANCED",
      custom: "CUSTOM WEIGHTS",
    }[balanceState.preset];
  }

  function updateBalanceCopy(center) {
    const dx = center.x - 0.5;
    const dy = center.y - 0.5;
    const offset = Math.hypot(dx, dy) * 100;
    balanceVisualCenter.textContent = `(${formatValue(center.x * 100)}, ${formatValue(center.y * 100)})`;
    balanceOffset.textContent = `${formatValue(offset)} units`;
    balanceTotalWeight.textContent = String(center.totalWeight);

    if (offset < 4) {
      balanceInsight.textContent = "视觉重量围绕画布中心形成较稳定的分布。";
    } else if (offset < 12) {
      const direction = dx >= 0 ? "右侧" : "左侧";
      balanceInsight.textContent = `视觉重心开始偏向${direction}，但整体仍保持一定平衡。`;
    } else {
      const horizontal = dx >= 0 ? "右" : "左";
      const vertical = dy <= 0 ? "上" : "下";
      balanceInsight.textContent = `视觉重量明显集中在${horizontal}${vertical}区域，整体重心发生偏移。`;
    }
  }

  function recordBalanceTrail(center) {
    if (!balanceState.showTrail) return;
    const last = balanceState.trail[balanceState.trail.length - 1];
    if (last && Math.hypot(last.x - center.x, last.y - center.y) < 0.001) return;
    balanceState.trail = [...balanceState.trail, { x: center.x, y: center.y }].slice(-24);
  }

  function drawBalance(duration = 0) {
    const container = balanceSvg.parentElement;
    const width = Math.max(300, Math.round(container.getBoundingClientRect().width));
    const height = width < 440 ? 300 : 420;
    const margin = { top: 24, right: 24, bottom: 24, left: 24 };
    const fieldWidth = width - margin.left - margin.right;
    const fieldHeight = height - margin.top - margin.bottom;
    const x = d3Api.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
    const y = d3Api.scaleLinear().domain([0, 1]).range([margin.top, height - margin.bottom]);
    const geometric = { x: x(0.5), y: y(0.5) };
    const center = computeVisualCenter();
    const visual = { x: x(center.x), y: y(center.y) };
    const svg = d3Api.select(balanceSvg);

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const defs = svg.selectAll("defs.balance-defs").data([null]).join("defs").attr("class", "balance-defs");
    const arrow = defs.selectAll("marker.balance-arrow").data([null]).join("marker")
      .attr("class", "balance-arrow")
      .attr("id", "balance-arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto-start-reverse");
    arrow.selectAll("path").data([null]).join("path").attr("d", "M 0 0 L 10 5 L 0 10 z");

    svg.selectAll("rect.balance-field-surface").data([null]).join("rect")
      .attr("class", "balance-field-surface")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", fieldWidth)
      .attr("height", fieldHeight);

    const reference = svg.selectAll("g.balance-reference").data([null]).join("g").attr("class", "balance-reference");
    reference.selectAll("ellipse.balance-reference-zone").data([null]).join("ellipse")
      .attr("class", "balance-reference-zone")
      .attr("cx", geometric.x)
      .attr("cy", geometric.y)
      .attr("rx", Math.min(84, fieldWidth * 0.14))
      .attr("ry", Math.min(66, fieldHeight * 0.2));
    const centerCross = reference.selectAll("g.balance-geometric-center").data([null]).join("g").attr("class", "balance-geometric-center");
    centerCross.selectAll("line").data(["horizontal", "vertical"]).join("line")
      .attr("class", (axis) => `balance-center-cross balance-center-cross--${axis}`)
      .attr("x1", (axis) => axis === "horizontal" ? geometric.x - 9 : geometric.x)
      .attr("x2", (axis) => axis === "horizontal" ? geometric.x + 9 : geometric.x)
      .attr("y1", (axis) => axis === "horizontal" ? geometric.y : geometric.y - 9)
      .attr("y2", (axis) => axis === "horizontal" ? geometric.y : geometric.y + 9);
    centerCross.selectAll("text").data([null]).join("text")
      .attr("x", geometric.x + 12)
      .attr("y", geometric.y - 12)
      .text("Geometric center");
    reference.selectAll("text.balance-reference-label").data([null]).join("text")
      .attr("class", "balance-reference-label")
      .attr("x", geometric.x - 84)
      .attr("y", geometric.y + Math.min(66, fieldHeight * 0.2) + 18)
      .text("Center reference area");

    const trail = svg.selectAll("g.balance-trail").data([null]).join("g").attr("class", "balance-trail");
    const trailSelection = trail.selectAll("circle.balance-trail-point").data(balanceState.trail, (_, index) => index).join("circle").attr("class", "balance-trail-point");
    trailSelection
      .attr("cx", (point) => x(point.x))
      .attr("cy", (point) => y(point.y))
      .attr("r", 3)
      .attr("opacity", (_, index, nodes) => ((index + 1) / nodes.length) * 0.34);
    trail.attr("display", balanceState.showTrail && balanceState.trail.length ? null : "none");

    const vector = svg.selectAll("line.balance-vector").data([null]).join("line").attr("class", "balance-vector");
    transition(vector, duration, (selection) => selection
      .attr("x1", geometric.x)
      .attr("y1", geometric.y)
      .attr("x2", visual.x)
      .attr("y2", visual.y));

    const visualCenter = svg.selectAll("g.balance-visual-center").data([null]).join("g").attr("class", "balance-visual-center");
    const visualRing = visualCenter.selectAll("circle.balance-visual-ring").data([null]).join("circle").attr("class", "balance-visual-ring");
    const visualDot = visualCenter.selectAll("circle.balance-visual-dot").data([null]).join("circle").attr("class", "balance-visual-dot");
    visualRing.attr("r", 9);
    visualDot.attr("r", 4);
    transition(visualRing, duration, (selection) => selection.attr("cx", visual.x).attr("cy", visual.y));
    transition(visualDot, duration, (selection) => selection.attr("cx", visual.x).attr("cy", visual.y));
    visualCenter.selectAll("text").data([null]).join("text")
      .attr("x", visual.x + 12)
      .attr("y", visual.y + 4)
      .text("Visual center");

    const drag = d3Api.drag()
      .on("start", function () {
        d3Api.select(this).raise().classed("is-dragging", true);
      })
      .on("drag", (event, mark) => {
        const [pointerX, pointerY] = d3Api.pointer(event, balanceSvg);
        mark.x = clamp(x.invert(pointerX), 0.04, 0.96);
        mark.y = clamp(y.invert(pointerY), 0.06, 0.94);
        recordBalanceTrail(computeVisualCenter());
        scheduleBalanceRender();
      })
      .on("end", function () {
        d3Api.select(this).classed("is-dragging", false);
      });
    const marks = svg.selectAll("circle.balance-mark").data(balanceState.marks, (mark) => mark.id).join("circle").attr("class", "balance-mark");
    marks
      .classed("is-selected", (mark) => mark.id === balanceState.selectedId)
      .attr("data-tooltip", (mark) => `Mark ${mark.id} · Visual weight ${mark.weight}`)
      .attr("aria-label", (mark) => `Mark ${mark.id}, visual weight ${mark.weight}`)
      .on("click", (_, mark) => {
        balanceState.selectedId = mark.id;
        syncBalanceControls();
        drawBalance();
      })
      .call(drag);
    transition(marks, duration, (selection) => selection
      .attr("cx", (mark) => x(mark.x))
      .attr("cy", (mark) => y(mark.y))
      .attr("r", (mark) => 7.5 * Math.sqrt(mark.weight)));

    updateBalanceCopy(center);
    syncBalanceControls();
  }

  function scheduleBalanceRender() {
    if (balanceState.renderFrame) return;
    balanceState.renderFrame = window.requestAnimationFrame(() => {
      balanceState.renderFrame = null;
      drawBalance();
    });
  }

  function applyBalancePreset(preset, duration = 600) {
    balanceState.preset = preset;
    balanceState.marks = balancePresets[preset].map((mark) => ({ ...mark }));
    balanceState.selectedId = "C";
    balanceState.trail = [];
    document.querySelectorAll("[data-balance-preset]").forEach((button) => {
      const active = button.dataset.balancePreset === preset;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    drawBalance(duration);
  }

  function setAlignmentNoise(value, duration = 180) {
    alignmentState.noise = Number(value);
    alignmentNoise.value = String(alignmentState.noise);
    drawAlignment(duration);
  }

  function setSpacingConsistency(value, duration = 180) {
    spacingState.consistency = Number(value);
    spacingConsistency.value = String(spacingState.consistency);
    document.querySelectorAll("[data-spacing-preset]").forEach((button) => {
      const active = (button.dataset.spacingPreset === "irregular" && spacingState.consistency === 0)
        || (button.dataset.spacingPreset === "systematic" && spacingState.consistency === 100);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    drawSpacing(duration);
  }

  alignmentNoise.addEventListener("input", (event) => setAlignmentNoise(event.target.value, 120));
  alignmentDeviations.addEventListener("change", () => {
    alignmentState.showDeviations = alignmentDeviations.checked;
    drawAlignment(120);
  });
  document.getElementById("alignment-snap").addEventListener("click", () => setAlignmentNoise(0, 320));
  document.getElementById("alignment-reset").addEventListener("click", () => setAlignmentNoise(8, 260));
  spacingConsistency.addEventListener("input", (event) => setSpacingConsistency(event.target.value, 120));
  document.querySelectorAll("[data-spacing-preset]").forEach((button) => {
    button.addEventListener("click", () => setSpacingConsistency(button.dataset.spacingPreset === "systematic" ? 100 : 0, 320));
  });

  document.querySelectorAll("[data-balance-preset]").forEach((button) => {
    button.addEventListener("click", () => applyBalancePreset(button.dataset.balancePreset));
  });
  balanceWeight.addEventListener("input", (event) => {
    const selected = selectedBalanceMark();
    if (!selected) return;
    selected.weight = Number(event.target.value);
    balanceState.preset = "custom";
    document.querySelectorAll("[data-balance-preset]").forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    recordBalanceTrail(computeVisualCenter());
    scheduleBalanceRender();
  });
  balanceTrail.addEventListener("change", () => {
    balanceState.showTrail = balanceTrail.checked;
    drawBalance();
  });
  document.getElementById("balance-reset").addEventListener("click", () => applyBalancePreset("balanced", 500));

  let resizeFrame = null;
  const redraw = () => {
    resizeFrame = null;
    drawAlignment();
    drawSpacing();
    if (constraintSvg) renderConstraintDiagram();
  };
  const resizeObserver = new ResizeObserver(() => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(redraw);
  });
  resizeObserver.observe(alignmentSvg.parentElement);
  resizeObserver.observe(spacingSequenceSvg.parentElement);
  resizeObserver.observe(spacingGapSvg.parentElement);
  if (balanceSvg) resizeObserver.observe(balanceSvg.parentElement);
  if (constraintSvg) resizeObserver.observe(constraintSvg.parentElement);

  drawAlignment();
  drawSpacing();
  if (balanceSvg) drawBalance();
  if (constraintSvg) initConstraintLab();
})();
