(() => {
  const storageKey = "layout-course-language";
  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const watchedAttributes = ["aria-label", "title", "placeholder"];

  // Keep translations close to the page rather than duplicating its DOM. Keys are the
  // Chinese source copy; the same translator also covers labels created by the D3 demos.
  const english = {
    "可视化导论第六章：从诊断到重构，学习如何进行页面布局。": "Introduction to Visualization, Chapter 6: learn page layout from diagnosis to redesign.",
    "如何进行页面布局": "Designing Page Layouts",
    "返回章节开头": "Back to chapter start",
    "章节导航": "Chapter navigation",
    "诊断布局": "Diagnose layout",
    "视觉层级": "Visual hierarchy",
    "信息分组": "Information grouping",
    "空间分配": "Space allocation",
    "响应布局": "Responsive layout",
    "综合重构": "Integrated redesign",
    "页面布局解决的，不只是元素放在哪里，而是": "Page layout is not just about where elements sit; it is about how",
    "信息关系": "information relationships",
    "应该以怎样的方式呈现给用户。": "should be presented to people.",
    "本章围绕同一个": "This chapter follows one",
    "Dashboard 案例": "Dashboard case",
    "，从一个数据和图表都没有明显问题、但页面关系混乱的状态出发，逐步建立更清晰的": ", beginning with sound data and charts but unclear page relationships, then building a clearer",
    "阅读路径": "reading path",
    "本章阅读逻辑": "Chapter reading path",
    "把隐藏关系显式化": "Make hidden relationships visible",
    "重排层级、分组与空间": "Reorganize hierarchy, groups and space",
    "让结构适应并回到案例": "Adapt the structure and return to the case",
    "先看到问题，再决定修改": "See the problem before changing it",
    "诊断布局，意味着": "Diagnosing a layout means",
    "先观察页面关系": "first observing its relationships",
    "，而不是立刻调整样式。": ", not immediately changing styles.",
    "先不要修改它": "Do not change it yet",
    "。先观察这个页面：图表本身是否有错？如果没有，为什么阅读体验依然不清晰？": ". First inspect the page: are the charts actually wrong? If not, why is the reading experience still unclear?",
    "把隐藏的空间关系显式化": "Make hidden spatial relationships visible",
    "不是在评价页面好不好看，而是把模块边界、对齐、间距、分组和": "does not judge whether a page looks good. It turns module bounds, alignment, spacing, grouping and",
    "预期阅读顺序": "expected reading order",
    "变成可以直接观察的证据。": "into evidence you can inspect directly.",
    "看模块边界；": "shows module bounds;",
    "看共同边缘；": "shows shared edges;",
    "看空白距离；": "shows whitespace distances;",
    "看语义分组；": "shows semantic groups;",
    "看预期阅读路径。": "shows the expected reading path.",
    "布局并不是“摆整齐”这么简单": "Layout is more than making things line up",
    "页面布局至少要同时关注": "A page layout needs to consider",
    "对齐、间距与层级": "alignment, spacing and hierarchy",
    "、分组、平衡和": ", grouping, balance and",
    "响应约束": "responsive constraints",
    "。本章把这些准则分别连接到": ". This chapter connects each principle to an",
    "可观察的实验": "observable experiment",
    "：Alignment、Spacing、Balance / Allocation 与 Responsive Constraints 已展开，Hierarchy 与 Grouping 则连接到后续的分析图。": ": Alignment, Spacing, Balance / Allocation and Responsive Constraints are explored here; Hierarchy and Grouping connect to the analysis views that follow.",
    "多个模块围绕共同轴线排列，其中一个模块偏离轴线": "Several modules align to a shared axis, with one module deviating from it",
    "布局准则理论骨架": "Layout-principle framework",
    "共同边界与轴线 · 本轮展开": "Shared edges and axes · explored here",
    "有限、重复的间距尺度 · 本轮展开": "A finite, repeated spacing scale · explored here",
    "视觉重要性与显著性 · 02": "Visual importance and prominence · 02",
    "靠近、分隔与共同区域 · 03": "Proximity, separation and common region · 03",
    "视觉重量与空间分配 · 04 · 本轮展开": "Visual weight and space allocation · 04 · explored here",
    "可用空间与结构重组 · 05 · 本轮展开": "Available space and structural reflow · 05 · explored here",
    "好的对齐不要求所有内容排在同一条线上，而是让页面拥有有限、清晰、可识别的": "Good alignment does not put everything on one line. It gives a page a small set of clear, recognizable",
    "共同轴线": "shared axes",
    "。间距统一也不意味着所有": ". Consistent spacing also does not mean every",
    "相同。": "is identical.",
    "布局准则也可以被数据化：": "Layout principles can also become data:",
    "可以转化为位置偏差，间距体系可以转化为": "can become positional deviation, and a spacing system can become a",
    "相关元素应建立稳定、可识别的": "Related elements should form stable, recognizable",
    "共同边界或轴线": "shared edges or axes",
    "。噪声越大，元素越偏离所属的": ". More noise means elements drift further from their",
    "元素仍大致形成三组，但共同边界开始变得模糊。": "The elements still roughly form three groups, but their shared edges are beginning to blur.",
    "间距不必全部相同，但应该围绕": "Spacing does not need to be identical, but it should be organized around a",
    "有限、重复、可识别的尺度体系": "finite, repeated and recognizable scale",
    "组织。8 / 16 / 24 / 32 是本教学实验的示例，不是所有网站的规定。": ". The 8 / 16 / 24 / 32 values are examples for this lesson, not requirements for every website.",
    "每个间距都像一次独立决定，页面很难形成稳定节奏。": "Each gap feels like an independent decision, so the page struggles to form a stable rhythm.",
    "抽象准则如何回到真实案例": "How abstract principles return to the real case",
    "Layout X-Ray 中的 alignment guides，正是在真实案例中寻找共同边界。": "The alignment guides in Layout X-Ray search for shared edges in the real case.",
    "Layout X-Ray 中的 spacing measurements，则用于观察页面是否形成稳定的间距节奏。": "Its spacing measurements reveal whether the page forms a stable spacing rhythm.",
    "下面回到 Initial Dashboard。": "Next, return to the Initial Dashboard.",
    "前面的实验把对齐和间距转成了可观察变量；要把这些判断带回真实页面，还需要读取模块的": "The earlier experiments turn alignment and spacing into observable variables. To bring those judgments back to a real page, we also need its modules’",
    "实际边界和位置": "actual bounds and positions",
    "读取真实模块的边界，把布局关系转成可以比较的坐标数据。": "Read real module bounds and turn layout relationships into comparable coordinate data.",
    "Why it matters：相对坐标把“看起来不齐”变成可以测量、比较的布局证据。": "Why it matters: relative coordinates turn ‘it looks misaligned’ into layout evidence that can be measured and compared.",
    "阅读提示：先看相对坐标，再看这些坐标如何支持 Bounds、Alignment 和 Reading order。": "Reading hint: start with relative coordinates, then see how they support Bounds, Alignment and Reading order.",
    "初始 Dashboard": "Initial Dashboard",
    "Dashboard 标题": "Dashboard title",
    "2026 新生画像": "2026 New Student Profile",
    "示例数据": "Illustrative data",
    "筛选器": "Filters",
    "全部地区": "All regions",
    "All regions / 全部地区": "All regions",
    "华东": "East China",
    "华北": "North China",
    "华中": "Central China",
    "华南": "South China",
    "西南": "Southwest China",
    "西北": "Northwest China",
    "东北": "Northeast China",
    "全部专业大类": "All major groups",
    "All groups / 全部专业大类": "All major groups",
    "计算机类": "Computing",
    "智能科学类": "Intelligent Sciences",
    "自动化类": "Automation",
    "电子信息类": "Electronic Information",
    "数理类": "Mathematics & Science",
    "当前视图：全部地区 · 全部专业大类": "Current view: All regions · All major groups",
    "新生总数": "New students",
    "专业数量": "Majors",
    "生源区域": "Source regions",
    "生源区域数量": "Source regions",
    "准备完成率": "Readiness rate",
    "专业构成": "Major composition",
    "专业人数 Treemap": "Major enrollment treemap",
    "各专业新生人数 Treemap": "New-student enrollment treemap by major",
    "入学准备完成度": "Enrollment readiness",
    "各专业入学准备完成度 Dot Plot": "Enrollment readiness dot plot by major",
    "地区与专业大类人数 Heatmap": "Student-count heatmap by region and major group",
    "生源地区 × 专业大类": "Source region × major group",
    "地区与专业大类 Heatmap": "Region and major-group heatmap",
    "地区图例": "Region legend",
    "人数密度": "Student density",
    "颜色越深，代表该组合中的示例人数越多。": "A darker color represents more illustrative students in that combination.",
    "Dashboard 说明": "Dashboard note",
    "数据本身并没有明显错误，但标题、指标、图表与图例之间的空间关系还没有形成清晰的阅读顺序。": "The data itself has no obvious error, but the spatial relationships among title, metrics, charts and legend do not yet form a clear reading order.",
    "Initial Dashboard 的问题不是数据错误，而是模块之间的关系没有形成稳定的阅读顺序；下一步先判断哪些信息应该获得更多视觉显著性。": "The Initial Dashboard’s problem is not bad data; its modules do not form a stable reading order. Next, decide which information deserves more visual prominence.",
    "让页面先回答“看什么”": "Let the page answer ‘what to see first’",
    "把内容的重要程度，转化成可被感知的差异。": "Turn content importance into differences people can perceive.",
    "的目标不是让所有内容一样显眼，而是让重要信息获得合适的面积、位置或": "does not make every item equally noticeable. It gives important information appropriate area, position or",
    "视觉显著性": "visual prominence",
    "。布局出现问题时，常见的并不是图表错误，而是信息重要性与视觉显著性没有匹配。": ". A layout issue is often not a chart error, but a mismatch between information importance and visual prominence.",
    "下面的": "The",
    "使用模块的语义重要程度和当前布局的可观察特征进行比较。": "compares a module’s semantic importance with observable features of the current layout.",
    "是一个透明的 layout prominence proxy：它不是眼动实验结果，也不是严格的人类视觉模型。": "is a transparent layout-prominence proxy: it is neither an eye-tracking result nor a strict model of human vision.",
    "层级判断的两个维度": "Two dimensions of hierarchy",
    "内容本身有多重要": "How important is the content itself?",
    "由角色、任务和阅读目的决定。": "It depends on role, task and reading purpose.",
    "页面让它有多显眼": "How noticeable does the page make it?",
    "由面积、位置和空间关系共同形成。": "It is shaped by area, position and spatial relationships.",
    "两者不一致时，问题不在于“重要性算错了”，而在于布局没有把判断结果转译成可感知的差异。": "When the two disagree, the problem is not that importance was calculated incorrectly. The layout has failed to translate the judgment into a perceptible difference.",
    "用面积与垂直位置构造一个透明的 layout prominence proxy。": "Use area and vertical position to construct a transparent layout-prominence proxy.",
    "Why it matters：这个代理模型让“重要性”和“页面是否让它足够显眼”之间的差异可以被检查。": "Why it matters: the proxy lets you inspect the gap between importance and whether the page gives it enough prominence.",
    "阅读提示：关注 areaScore 与 positionScore 如何共同影响显著性；它不是眼动预测。": "Reading hint: focus on how areaScore and positionScore jointly affect prominence; this is not an attention prediction.",
    "教学代理模型：": "Teaching proxy:",
    "布局显著性": "layout prominence",
    "面积更大、位置更靠上，通常会形成更多": "Larger area and a higher position usually create more",
    "。这个简化公式用于让抽象概念可以被观察，不用于预测真实注意力。": ". This simplified formula makes an abstract concept observable; it does not predict real attention.",
    "Information Importance 与 Visual Prominence 散点图": "Information Importance and Visual Prominence scatter plot",
    "Information Importance / 信息重要程度": "Information Importance",
    "Visual Prominence / 视觉显著程度": "Visual Prominence",
    "散点图图例": "Scatter plot legend",
    "Dashboard 当前布局 Minimap": "Current Dashboard layout minimap",
    "模块位置按当前 Dashboard 的真实 bounding boxes 缩放。": "Module positions are scaled from the current Dashboard’s real bounding boxes.",
    "Gap = Prominence − Importance。阈值仅用于本教学示例：低于 −1 为突出不足，高于 1 为过度突出，其余视为基本匹配。": "Gap = Prominence − Importance. These thresholds are for this lesson only: below −1 means under-prominent, above 1 means over-prominent, and the rest are broadly matched.",
    "层级回答了“先看什么”，但还没有回答“哪些内容应该一起看”；因此下一节把语义关系继续翻译为空间关系。": "Hierarchy answers ‘what to see first,’ not yet ‘what should be read together.’ The next section translates semantic relationships into spatial ones.",
    "把信息关系变成空间关系": "Turn information relationships into spatial relationships",
    "靠近、分隔和对齐，会让相关信息自然形成一组。": "Proximity, separation and alignment help related information form a natural group.",
    "分组不是给每一个模块都加一个容器，而是让相关内容共享": "Grouping is not about adding a container to every module. It lets related content share",
    "边界、节奏或起点": "a boundary, rhythm or starting point",
    "。当空间关系足够清楚时，用户就不必依赖额外的说明文字来理解结构。": ". When spatial relationships are clear enough, people do not need extra explanatory text to understand the structure.",
    "本节把 Dashboard 的语义关系映射成": "This section maps the Dashboard’s semantic relationships to",
    "，再与真实页面中的空间距离进行比较。强关系如果在页面上相距很远，就可能形成值得检查的分组问题。": ", then compares them with spatial distances on the real page. Strong relationships that sit far apart may reveal a grouping problem worth inspecting.",
    "分组判断的三个空间线索": "Three spatial cues for grouping",
    "相关内容靠近，减少寻找成本。": "Related content is close together, reducing search cost.",
    "共享边界，提示属于同一组。": "A shared boundary signals membership in the same group.",
    "共享起点或轴线，保持结构稳定。": "A shared starting point or axis keeps the structure stable.",
    "先决定哪些内容应该一起被阅读": "First decide which content should be read together",
    "，再决定它们应该使用什么视觉样式。这里的距离阈值只服务于本教学案例，不是通用设计规则。": ", then decide which visual treatment they need. The distance thresholds serve this teaching case only; they are not universal design rules.",
    "文字可以列举关系，却不容易让人看出关系是否真的落在同一片空间里；下面的图把": "Text can list relationships, but it cannot easily show whether they really occupy the same spatial area. The view below places",
    "语义连线与真实距离": "semantic links and real distances",
    "并置起来。": "side by side.",
    "把两个模块中心之间的空间距离转成可检查的 proximity 信号。": "Turn the distance between two module centers into an inspectable proximity signal.",
    "Why it matters：中心距离提供了空间证据，但不会把“靠近”误当成唯一的语义判断。": "Why it matters: center distance provides spatial evidence without treating proximity as the only semantic judgment.",
    "阅读提示：距离越大，不代表关系越弱；它说明语义关系与空间关系之间值得检查。": "Reading hint: a greater distance does not mean a weaker relationship; it signals a relationship between semantics and space worth checking.",
    "Dashboard 信息关系图": "Dashboard information-relationship graph",
    "关系类型图例": "Relationship-type legend",
    "Dashboard 空间关系视图": "Dashboard spatial-relationship view",
    "proximity、common region 和 alignment": "proximity, common region and alignment",
    "Current 使用真实 Dashboard bounding boxes；Grouped 是一种更符合语义分组的布局方案。": "Current uses real Dashboard bounding boxes; Grouped is one layout proposal that better reflects semantic grouping.",
    "地区与专业大类 ↔ 地区图例 · Strong · Spatial distance: Far · 关系紧密，但空间分组较弱。": "Region and major group ↔ Region legend · Strong · Spatial distance: Far · The relationship is close, but its spatial grouping is weak.",
    "Grouped state 只是“一种更符合语义分组的布局方案”，不是系统自动生成的最优布局。Reorganize 只作用于本节 Spatial Layout View，不会修改上方 Initial Dashboard。": "The Grouped state is only one layout proposal that better reflects semantic grouping, not an automatically generated optimum. Reorganize affects this Spatial Layout View only; it does not change the Initial Dashboard above.",
    "Graph 区分了“应该相关”和“当前靠得近”这两件事；当关系被确认后，还要决定有限空间应该优先给谁。": "The graph distinguishes ‘should be related’ from ‘is currently close.’ Once relationships are confirmed, decide what deserves priority in limited space.",
    "为不同信息分配不同空间": "Allocate different space to different information",
    "页面空间是一种": "Page space is a",
    "有限资源": "limited resource",
    "，分配方式会直接表达": ", and its allocation directly expresses",
    "优先级": "priority",
    "先确定页面中必须被": "First identify the areas that must be",
    "快速扫描": "scanned quickly",
    "的区域，再安排需要深入阅读的内容。宽度、留白和模块面积都可以成为一种无声的提示，帮助用户建立稳定的": ", then arrange content that needs deeper reading. Width, whitespace and module area can quietly help people build a stable",
    "Treemap 在这里借用“把权重映射到有限矩形面积”的视觉思想，把页面看成一笔固定的": "Here, the Treemap borrows the idea of mapping weights to finite rectangular areas and treats the page as a fixed",
    "空间预算": "space budget",
    "。它是帮助我们观察分配关系的概念模型，不是网页自动布局算法；": ". It is a conceptual model for observing allocation relationships, not an automatic web-layout algorithm;",
    "信息重要性": "information importance",
    "越高，也不意味着它必须占据同等倍数的面积。": "being higher does not mean it must receive proportionally more area.",
    "空间分配如何影响阅读路径": "How allocation affects a reading path",
    "可用面积有限": "Available area is limited",
    "视觉权重": "Visual weight",
    "大小与位置传达优先级": "Size and position signal priority",
    "用户更快找到重点": "People find priorities faster",
    "真实页面还要同时满足图表宽度、内容密度、控件固定空间和": "A real page must also satisfy chart width, content density, fixed control space and",
    "最小可读尺寸": "minimum readable size",
    "。Dashboard 的 filters 保持为顶部固定控制条，不进入主体面积分配。下面的": ". The Dashboard filters remain a fixed top control bar and do not enter the main area allocation. The",
    "只是一个教学极端，用来观察当重要性逐渐影响面积时会发生什么。": "is only a teaching extreme for observing what happens as importance gradually affects area.",
    "这条因果链说明了为什么“": "This causal chain shows why ‘",
    "面积": "area",
    "”不是单纯的美化参数；下面的代码和 Treemap 只负责呈现空间结果，": "’ is not merely a decorative parameter. The code and Treemap below only render the spatial result;",
    "权重": "weights",
    "仍然需要由设计者定义。": "still need to be defined by a designer.",
    "混合当前占地与信息重要性，再把结果交给 Treemap 映射为空间。": "Blend current footprint and information importance, then hand the result to a Treemap to map it into space.",
    "D3 负责把权重映射为空间，但权重如何定义仍然是设计决策。": "D3 maps weights into space, but defining those weights remains a design decision.",
    "阅读提示：先看 weight 的来源，再看 size 与 padding 如何把判断转成面积和分组。": "Reading hint: first inspect where weight comes from, then see how size and padding turn a judgment into area and grouping.",
    "平衡不等于左右镜像": "Balance does not mean left-right symmetry",
    "。不同": ". Different",
    "视觉重量": "visual weights",
    "在二维空间中的分布，可以形成相对稳定的整体关系；这个实验只隔离 position 与 area / visual weight 两个变量。": "distributed in two-dimensional space can form a relatively stable whole. This experiment isolates only position and area / visual weight.",
    "非对称并不意味着失衡，不同视觉重量仍可以形成稳定关系。": "Asymmetry does not imply imbalance; different visual weights can still form a stable relationship.",
    "只是教学模型，不是自动判断页面好坏的规则。真实页面的": "is only a teaching model, not a rule that automatically judges a page. On a real page,",
    "还会受到 color、contrast、typography 与 content complexity 影响。": "is also affected by color, contrast, typography and content complexity.",
    "改变一个元素的面积，不仅改变它自身获得的空间，也会改变整个画面的": "Changing one element’s area changes not only the space it receives, but also the page’s overall",
    "视觉重量分布": "visual-weight distribution",
    "。因此，页面空间分配还需要考虑这些空间共同形成的": ". Page allocation must therefore consider the",
    "整体平衡": "overall balance",
    "下面进入 Page Allocation Map。": "Next, enter the Page Allocation Map.",
    "页面模块空间分配 Treemap": "Page-module allocation treemap",
    "语义组保持可见，模块面积随 Current footprint 与 Information importance 的混合权重变化。": "Semantic groups remain visible as module area changes with the blended weights of Current footprint and Information importance.",
    "分配解决了桌面空间里的": "Allocation resolves",
    "，但可用空间会继续变化；下一节要判断什么时候应该缩放，什么时候必须": "on a desktop, but available space keeps changing. The next section decides when to resize and when to",
    "重排": "reflow",
    "让结构适应屏幕，而不是缩小一切": "Let structure adapt to the screen, not shrink everything",
    "响应式布局": "Responsive layout",
    "的重点，是保护": "protects",
    "在不同尺寸下仍然成立。": "across different sizes.",
    "当屏幕变窄时，布局需要": "When the screen narrows, the layout must",
    "重新做取舍": "make new trade-offs",
    "：哪些内容保持并列，哪些内容转为纵向，哪些辅助信息可以暂时退后。好的适配会改变空间组织，但不会破坏页面的": ": what stays side by side, what becomes vertical, and which secondary information can move back. Good adaptation changes spatial organization without breaking the page’s",
    "核心判断路径": "core decision path",
    "是在相同拓扑中调整尺寸；": "adjusts size within the same topology;",
    "则是在可用空间不足时重新组织列数、顺序和分组。下面的 Responsive Viewport Lab 使用具体的教学阈值来演示这个过程，它们不是通用设备标准。": "reorganizes columns, order and grouping when available space is insufficient. The Responsive Viewport Lab below uses teaching thresholds to demonstrate this process; they are not universal device standards.",
    "Resize 与 Reflow 的区别": "The difference between Resize and Reflow",
    "结构不变，尺寸调整": "Structure stays; size changes",
    "同一组关系在更宽或更窄的空间中重新分配。": "The same relationships are redistributed in wider or narrower space.",
    "结构改变，关系重组": "Structure changes; relationships reorganize",
    "当可读宽度不够时，列数、顺序或分组发生变化。": "When readable width is insufficient, column count, order or grouping changes.",
    "响应式不是把固定画布整体缩小，而是让": "Responsive design does not scale down a fixed canvas. It lets",
    "先改变，再由": "change first, then lets",
    "、信息关系和最低模块尺寸决定是否重组。": ", information relationships and minimum module sizes decide whether a reorganization is needed.",
    "用 CSS Grid 表达常规桌面结构，并在可读宽度不足时切换为单列。": "Use CSS Grid for the standard desktop structure and switch to one column when readable width is insufficient.",
    "CSS 负责真实网页的 reflow；本实验使用 D3 把 layout state 之间的变化过程可视化。": "CSS handles real-page reflow; this experiment uses D3 to visualize the transition between layout states.",
    "阅读提示：这里的关键不是缩小所有模块，而是改变列关系来保护可读宽度。": "Reading hint: the point is not to shrink every module, but to change column relationships to protect readable width.",
    "根据 viewport 状态计算模块坐标，再把状态变化画成可观察的重排。": "Calculate module coordinates from viewport state, then draw state changes as observable reflow.",
    "阅读提示：computeLayout 决定结构，D3 只负责把结构变化呈现出来。": "Reading hint: computeLayout decides the structure; D3 only presents the structural change.",
    "响应式布局的变化，本质上由": "Responsive layout changes are fundamentally determined by",
    "可用空间": "available space",
    "和": "and",
    "最小可读约束": "minimum readability constraints",
    "共同决定，而不是由设备名称决定。": ", not by device names.",
    "每条边界都来自可读宽度约束，而不是随机 breakpoint。": "Every boundary comes from a readable-width constraint, not a random breakpoint.",
    "当前空间可以容纳三列；如果继续增加列数，模块会低于最低可读宽度，因此布局需要减少列数。": "The current space accommodates three columns. Adding another would take modules below their minimum readable width, so the layout must reduce columns.",
    "这是用于理解": "This is a teaching model for understanding",
    "的教学模型，不是所有真实网页都用同一个公式计算列数。真实布局还要同时考虑内容关系、固定控件与语义分组。": ", not a formula every real website uses to calculate columns. Real layouts also consider content relationships, fixed controls and semantic grouping.",
    "Phase Diagram 回答“何时应该": "The Phase Diagram answers ‘when should the layout",
    "改变布局结构": "change structure",
    "？”下面的 Responsive Viewport Lab 则展示布局结构改变以后，页面具体怎样重排。": "?’ The Responsive Viewport Lab below shows how the page reflows after its structure changes.",
    "Responsive Viewport Lab 让“结构改变”变得可见；最后还需要把诊断、层级、分组、分配和适配放回同一个案例，检查它们是否彼此支持。": "The Responsive Viewport Lab makes structural change visible. Finally, put diagnosis, hierarchy, grouping, allocation and adaptation back into one case to see whether they support one another.",
    "把原则放回一个完整案例": "Put the principles back into one complete case",
    "，让诊断、层级、分组、空间与响应共同工作。": ", letting diagnosis, hierarchy, grouping, space and responsiveness work together.",
    "最终的布局不是一组孤立技巧的叠加，而是一套": "The final layout is not a stack of isolated techniques, but a set of",
    "相互支持的关系": "mutually supporting relationships",
    "。我们会回到最初那个 Dashboard，保留数据和图表本身，重新安排它们出现的": ". We return to the original Dashboard, keep the data and charts, and rearrange their",
    "顺序、密度和空间位置": "order, density and spatial positions",
    "重构的目标是减少解释成本": "The goal of redesign is to reduce explanation cost",
    "当": "When",
    "视觉层级和空间关系": "visual hierarchy and spatial relationships",
    "足够明确，用户可以": "are clear enough, people can",
    "把注意力留给数据本身": "keep their attention on the data itself",
    "。布局的完成，不是页面看起来更满，而是每一次停顿都有理由。": ". A layout is finished not when it looks fuller, but when every pause has a reason.",
    "综合重构的三步逻辑": "Three steps of integrated redesign",
    "先保留证据": "Preserve the evidence first",
    "重新判断关系": "Reassess relationships",
    "组织成可读结构": "Compose a readable structure",
    "把前面形成的设计判断保存为不同 state，再用一次过渡展示重构过程。": "Save the design judgments formed above as different states, then use a transition to show the redesign.",
    "前面的设计分析决定 target state，D3 负责把不同空间状态之间的变化可视化。": "The preceding analysis decides the target state; D3 visualizes changes between spatial states.",
    "阅读提示：变化的是位置和尺寸，不是数据；这正是布局重构的可视化过程。": "Reading hint: positions and sizes change, not the data; that is the visualization of layout redesign.",
    "从图表堆砌到清晰的信息结构 · From visual clutter to structured layout": "From visual clutter to structured information",
    "先观察真实的空间结构。": "First observe the real spatial structure.",
    "保留初始 Dashboard，不修改任何模块。": "Keep the initial Dashboard; change no modules.",
    "图表没有明显错误，但页面关系仍然混乱。": "The charts have no obvious error, but the page relationships remain unclear.",
    "重要信息获得更明确的视觉权重。": "Important information receives clearer visual weight.",
    "相关模块形成更清晰的空间分组。": "Related modules form clearer spatial groups.",
    "布局可以在不同可用宽度下重新组织。": "The layout can reorganize at different available widths.",
    "对齐与间距更加统一。": "Alignment and spacing become more consistent.",
    "Layout Surgery 把前面的原则串成一个连续过程；Final Dashboard 不是另一份数据，而是": "Layout Surgery joins the earlier principles into one continuous process. The Final Dashboard is not another dataset; it is the",
    "同一案例": "same case",
    "在这些判断之后形成的结果。": "result after these judgments.",
    "相同的数据与图表": "The same data and charts",
    "，通过重新组织层级、分组与空间关系，形成": ", reorganized through hierarchy, grouping and spatial relationships, form a",
    "更清晰的页面结构": "clearer page structure",
    "结果页需要回答的不是“改了多少”，而是“": "The result page should answer not ‘how much changed,’ but ‘",
    "为什么现在更容易读": "why is it easier to read now",
    "”；下面的说明把这种变化收束成四个可检查的判断。": "?’ The notes below summarize that change as four inspectable judgments.",
    "专业构成获得与重要性更匹配的视觉空间。": "Major composition receives visual space better matched to its importance.",
    "Heatmap 与 legend 形成紧密信息组。": "The Heatmap and legend form a close information group.",
    "KPI、边界与间距建立统一节奏。": "KPIs, boundaries and spacing establish a consistent rhythm.",
    "真实 CSS 布局可根据可用空间重新组织。": "A real CSS layout can reorganize around available space.",
    "本章总结": "Chapter summary",
    "页面布局不是把模块摆得更整齐，而是让": "Page layout is not about arranging modules more neatly. It lets",
    "层级、分组、空间和响应": "hierarchy, grouping, space and responsiveness",
    "共同支持一条清晰的阅读路径。": "support one clear reading path.",
    "计算机科学": "Computer Science",
    "计算机科学与技术": "Computer Science and Technology",
    "人工智能": "Artificial Intelligence",
    "软件工程": "Software Engineering",
    "数据科学": "Data Science",
    "电子信息": "Electronic Information",
    "自动化": "Automation",
    "信息管理": "Information Management",
    "数学": "Mathematics",
    "数据科学与大数据技术": "Data Science and Big Data Technology",
    "电子信息工程": "Electronic Information Engineering",
    "数学与应用数学": "Mathematics and Applied Mathematics",
    "信息管理与信息系统": "Information Management and Information Systems",
    "地区与专业大类": "Region and major group",
    "突出不足": "Under-prominent",
    "过度突出": "Over-prominent",
    "基本匹配": "Broadly matched",
    "关系紧密，但空间分组较弱。": "The relationship is close, but its spatial grouping is weak.",
    "地区与专业大类 ↔ 地区图例 · Strong · Spatial distance: Moderate · 关系紧密，但空间分组较弱。": "Region and major group ↔ Region legend · Strong · Spatial distance: Moderate · The relationship is close, but its spatial grouping is weak.",
    "地区与专业大类 ↔ 地区图例 · Strong · Spatial distance: Far · 关系紧密，但空间分组较弱。": "Region and major group ↔ Region legend · Strong · Spatial distance: Far · The relationship is close, but its spatial grouping is weak.",
    "Grouped state 让紧密关系共享更近的空间区域。": "The Grouped state lets close relationships share a nearer spatial area.",
    "地区与专业大类 ↔ 地区图例 · Strong · Spatial distance: Closer · Grouped state 让紧密关系共享更近的空间区域。": "Region and major group ↔ Region legend · Strong · Spatial distance: Closer · The Grouped state lets close relationships share a nearer spatial area.",
    "视觉重量围绕画布中心形成较稳定的分布。": "Visual weight forms a relatively stable distribution around the canvas center.",
    "多个元素共享有限的对齐轴，结构更稳定。": "Several elements share a limited set of alignment axes, making the structure more stable.",
    "接近但不一致的边界增加了空间噪声。": "Nearly aligned but inconsistent edges add spatial noise.",
    "间距开始围绕有限尺度聚集，但仍存在局部差异。": "The gaps are starting to cluster around a limited scale, but local differences remain.",
    "有限、重复的间距尺度建立了更清晰的空间节奏。统一节奏不等于所有 gap 相同。": "A finite, repeated spacing scale creates a clearer spatial rhythm. Consistency does not mean every gap is identical.",
    "内容对最小宽度的需求提高，即使 available width 不变，也可能触发重新布局。": "A higher minimum-width demand can trigger a new layout even when available width stays the same.",
    "Minimum readable width 正在变化，但当前列数仍然可行，因此这次只是 RESIZE。": "Minimum readable width is changing, but the current column count remains feasible, so this is only a RESIZE.",
    "当前空间足以让四个模块并列，同时满足最低可读宽度。": "The current space fits four modules side by side while meeting the minimum readable width.",
    "当前空间可以容纳两列；再增加一列会低于最低可读宽度，布局需要保留更宽的模块。": "The current space accommodates two columns; another would drop below minimum readable width, so modules need to remain wider.",
    "当前空间只能容纳一列；模块需要保持最低可读宽度，布局因此转为单列。": "The current space accommodates one column only; modules must keep their minimum readable width, so the layout becomes a single column.",
    "视觉重心开始偏向": "The visual center begins to lean toward the ",
    "右侧": "right",
    "左侧": "left",
    "，但整体仍保持一定平衡。": ", but the overall composition retains some balance.",
    "视觉重量明显集中在": "Visual weight is clearly concentrated in the ",
    "右": "right",
    "左": "left",
    "上": "upper",
    "下": "lower",
    "区域，整体重心发生偏移。": " area, shifting the overall center of mass.",
    "视觉重心开始偏向右侧，但整体仍保持一定平衡。": "The visual center begins to lean right, but the overall composition retains some balance.",
    "视觉重心开始偏向左侧，但整体仍保持一定平衡。": "The visual center begins to lean left, but the overall composition retains some balance.",
    "视觉重量明显集中在右上区域，整体重心发生偏移。": "Visual weight is clearly concentrated in the upper-right area, shifting the overall center of mass.",
    "视觉重量明显集中在右下区域，整体重心发生偏移。": "Visual weight is clearly concentrated in the lower-right area, shifting the overall center of mass.",
    "视觉重量明显集中在左上区域，整体重心发生偏移。": "Visual weight is clearly concentrated in the upper-left area, shifting the overall center of mass.",
    "视觉重量明显集中在左下区域，整体重心发生偏移。": "Visual weight is clearly concentrated in the lower-left area, shifting the overall center of mass.",
    "总人数": "Total students",
    "专业数": "Major count",
    "生源区": "Source region",
    "准备率": "Readiness",
    "地区 × 专业": "Region × major",
    "完成度": "Completion",
    "说明": "Note",
    "当前空间可以容纳三列；继续维持四列会使模块低于最低可读宽度，因此布局需要减少列数。": "The current space accommodates three columns. Keeping four would take modules below their minimum readable width, so the layout must reduce columns.",
    "重要内容面积偏小": "Important content has too little area",
    "与 Heatmap 分组较弱": "Weakly grouped with the Heatmap",
    "阅读路径不够明确": "Reading path is not clear enough",
    "先看见问题，再决定修改。": "See the problem before deciding what to change.",
    "位置保持不变，只标出面积、分组与阅读路径问题。": "Keep positions unchanged; mark only area, grouping and reading-path issues.",
    "诊断需要建立在真实模块边界和空间距离上。": "Diagnosis needs real module bounds and spatial distances.",
    "重要信息获得更合适的视觉权重。": "Important information receives more appropriate visual weight.",
    "专业构成扩大，次要模块相对弱化，KPI 保留 overview。": "Major composition expands, secondary modules recede, and KPIs retain the overview.",
    "专业构成 Importance 较高，但初始布局中的视觉显著性不足。": "Major composition has high importance but insufficient prominence in the initial layout.",
    "把语义关系映射为空间关系。": "Map semantic relationships into spatial relationships.",
    "KPI、专业、地区、完成度与控制区形成更清楚的邻近关系。": "KPIs, majors, regions, completion and controls form clearer proximity relationships.",
    "相关模块靠近后，用户更容易沿着同一信息关系继续阅读。": "When related modules are closer, people can more easily keep reading along the same information relationship.",
    "在有限页面空间中建立合理比例。": "Establish sensible proportions in limited page space.",
    "专业构成成为主要区域，Heatmap 与 legend 保持完整可读。": "Major composition becomes the primary area while the Heatmap and legend remain fully readable.",
    "空间预算需要综合 importance、模块类型和最低可读尺寸。": "A space budget must balance importance, module type and minimum readable size.",
    "让结构适应空间，而不是缩小一切。": "Let structure adapt to space rather than shrinking everything.",
    "同一重构布局在 Wide、Medium、Narrow 间改变列数与阅读流。": "The same redesigned layout changes its column count and reading flow across Wide, Medium and Narrow.",
    "响应式验证的是核心关系能否在不同可用宽度下成立。": "Responsive validation checks whether core relationships survive across available widths.",
    "让层级、分组、空间与响应共同工作。": "Let hierarchy, grouping, space and responsiveness work together.",
    "回到 Wide，隐藏诊断辅助，只保留一种更清晰的布局方案。": "Return to Wide, hide diagnostic aids and retain one clearer layout proposal.",
    "布局是相互约束的设计决策，不是自动产生的唯一最优答案。": "Layout is a set of mutually constrained design decisions, not an automatically produced single optimum.",
    "相同的数据与图表，通过重新组织层级、分组与空间关系，形成更清晰的页面结构。": "The same data and charts form a clearer page structure after hierarchy, grouping and spatial relationships are reorganized.",
    "新生总": "New students",
    "准备完": "Readiness",
    "专业构": "Major mix",
    "地区与": "Region × major",
    "入学准": "Enrollment",
    "图例": "Legend",
    "模块：": "Module: ",
    "当前视图：": "Current view: ",
    "人数：": "Students: ",
    "占比：": "Share: ",
    "完成度：": "Completion: ",
    "D3.js 加载失败。请确认浏览器可以访问 CDN，然后重新打开页面。": "D3.js failed to load. Confirm that the browser can access the CDN, then reopen the page.",
    "示例数据暂时无法加载，请确认通过 Live Server 打开页面。": "Illustrative data could not load. Confirm that the page is open through Live Server.",
  };

  const trimAndRestore = (value, translated) => {
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    return `${leading}${translated}${trailing}`;
  };

  function translate(value, language = document.documentElement.lang) {
    if (language !== "en" || typeof value !== "string") return value;
    const source = value.trim();
    if (!source) return value;
    const punctuation = { "。": ".", "，": ",", "；": ";", "：": ":", "？": "?", "！": "!" };
    return trimAndRestore(value, english[source] || punctuation[source] || source);
  }

  function isSkippable(node) {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest("script, style, code, pre"));
  }

  function applyTextNode(node, language) {
    if (node.nodeType !== Node.TEXT_NODE || isSkippable(node)) return;
    const current = node.nodeValue || "";
    if (!current.trim()) return;
    const stored = originalText.get(node);
    const previousRender = renderedText.get(node);
    let source = stored || current;

    if (!stored || (language === "en" && current !== previousRender) || (language === "zh-CN" && current !== source && current !== previousRender)) {
      source = current;
      originalText.set(node, source);
    }

    const next = language === "en" ? translate(source, language) : source;
    if (current !== next) node.nodeValue = next;
    renderedText.set(node, next);
  }

  function applyAttributes(element, language) {
    if (!(element instanceof Element) || element.closest("script, style, code, pre")) return;
    let stored = originalAttributes.get(element);
    if (!stored) {
      stored = new Map();
      originalAttributes.set(element, stored);
    }
    watchedAttributes.forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (!current) return;
      const original = stored.get(attribute) || current;
      if (!stored.has(attribute)) stored.set(attribute, original);
      const next = language === "en" ? translate(original, language) : original;
      if (current !== next) element.setAttribute(attribute, next);
    });
  }

  function applyTo(root = document, language = document.documentElement.lang) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => applyTextNode(node, language));
    if (root instanceof Element) applyAttributes(root, language);
    root.querySelectorAll?.("[aria-label], [title], [placeholder]").forEach((element) => applyAttributes(element, language));
  }

  function setLanguage(language) {
    const nextLanguage = language === "en" ? "en" : "zh-CN";
    document.documentElement.lang = nextLanguage;
    document.documentElement.dataset.language = nextLanguage === "en" ? "en" : "zh";
    document.title = nextLanguage === "en" ? "Chapter 06 — Designing Page Layouts" : "Chapter 06 — 如何进行页面布局";
    applyTo(document.body, nextLanguage);
    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === (nextLanguage === "en" ? "en" : "zh");
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    localStorage.setItem(storageKey, nextLanguage);
    window.dispatchEvent(new CustomEvent("site:language-change", { detail: { language: nextLanguage } }));
  }

  window.siteI18n = {
    get language() { return document.documentElement.lang; },
    get isEnglish() { return document.documentElement.lang === "en"; },
    translate,
    setLanguage,
  };

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  const savedLanguage = localStorage.getItem(storageKey);
  setLanguage(savedLanguage === "en" ? "en" : "zh");

  const observer = new MutationObserver((records) => {
    const language = document.documentElement.lang;
    records.forEach((record) => {
      if (record.type === "characterData") applyTextNode(record.target, language);
      if (record.type === "attributes") applyAttributes(record.target, language);
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) applyTextNode(node, language);
        if (node.nodeType === Node.ELEMENT_NODE) applyTo(node, language);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: watchedAttributes });
})();
