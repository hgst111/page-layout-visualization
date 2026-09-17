(() => {
  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const sections = [...document.querySelectorAll("main > section[id]")];
  const stages = [...document.querySelectorAll("[data-stage]")];

  const setActiveSection = (sectionId) => {
    sectionLinks.forEach((link) => {
      const isActive = link.dataset.sectionLink === sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.dataset.sectionLink);
      if (!target) return;

      event.preventDefault();
      setActiveSection(link.dataset.sectionLink);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${link.dataset.sectionLink}`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleSections[0]) {
        setActiveSection(visibleSections[0].target.id);
      }
    },
    {
      rootMargin: "-18% 0px -62% 0px",
      threshold: [0, 0.2, 0.5],
    },
  );

  sections.forEach((section) => observer.observe(section));

  const initialSection = window.location.hash.slice(1);
  setActiveSection(
    sectionLinks.some((link) => link.dataset.sectionLink === initialSection)
      ? initialSection
      : "diagnose",
  );

  stages.forEach((stage) => {
    const status = stage.querySelector(".stage-status");
    const resetButton = stage.querySelector('[data-action="reset"]');
    const guidesButton = stage.querySelector('[data-action="guides"]');

    resetButton?.addEventListener("click", () => {
      stage.classList.remove("is-guided");
      guidesButton?.setAttribute("aria-pressed", "false");
      if (status) status.textContent = "Stage reset. Ready for the next experiment.";
    });

    guidesButton?.addEventListener("click", () => {
      const isGuided = stage.classList.toggle("is-guided");
      guidesButton.setAttribute("aria-pressed", String(isGuided));
      if (status) {
        status.textContent = isGuided
          ? "Guides are visible for spatial inspection."
          : "Guides hidden. Ready for the next experiment.";
      }
    });
  });
})();
