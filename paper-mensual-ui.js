(() => {
  const ROUTE = "#/paper";
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  let frame = 0;

  function currentRoute() {
    return String(location.hash || "#/inicio").split("?")[0];
  }

  function parseMonthLabel(value) {
    const text = String(value || "").trim();
    let match = /^(\d{1,2})\/(\d{4})$/.exec(text);
    if (!match) {
      const iso = /^(\d{4})-(\d{1,2})/.exec(text);
      if (iso) match = [iso[0], iso[2], iso[1]];
    }
    if (!match) return { year: "Otros", month: text || "Sin mes", label: text || "Sin mes" };
    const index = Number(match[1]) - 1;
    const year = match[2];
    const month = MONTHS[index] || `Mes ${match[1]}`;
    return { year, month, label: `${month} ${year}` };
  }

  function enhanceFeatured(shell) {
    const featured = shell.querySelector(".gf-paper-featured");
    if (!featured) return;
    featured.classList.add("pm-featured");
    const tag = featured.querySelector(".gf-tag");
    if (tag) {
      const info = parseMonthLabel(tag.textContent);
      tag.textContent = info.label;
      tag.classList.add("pm-featured-month");
      if (!featured.querySelector(".pm-current")) {
        const current = document.createElement("span");
        current.className = "pm-current";
        current.textContent = "Lectura actual";
        tag.before(current);
      }
    }
  }

  function decoratePaperItem(item, info, title) {
    item.classList.add("pm-paper-item");
    const month = document.createElement("span");
    month.className = "pm-month";
    month.textContent = info.month;

    const heading = document.createElement("strong");
    heading.textContent = title;

    const open = document.createElement("span");
    open.className = "pm-open";
    open.textContent = "Abrir";

    item.replaceChildren(month, heading, open);
    item.setAttribute("aria-label", `${info.label}: ${title}`);
  }

  function enhanceRepository(shell) {
    const repo = shell.querySelector(".gf-repo");
    const list = repo?.querySelector(".gf-repo-list");
    if (!repo || !list || list.dataset.pmGrouped === "true") return;

    repo.classList.add("pm-repo");
    const title = repo.querySelector("h2");
    if (title) title.textContent = "Biblioteca por mes";

    if (!repo.querySelector(".pm-repo-copy")) {
      const copy = document.createElement("p");
      copy.className = "pm-repo-copy";
      copy.textContent = "Revisa las lecturas anteriores ordenadas cronológicamente.";
      title?.after(copy);
    }

    const items = Array.from(list.querySelectorAll(":scope > .gf-repo-item"));
    if (!items.length) return;

    const groups = new Map();
    items.forEach((item) => {
      const originalTitle = item.querySelector("strong")?.textContent?.trim() || "Paper";
      const rawMonth = item.querySelector("span")?.textContent || "";
      const info = parseMonthLabel(rawMonth);
      decoratePaperItem(item, info, originalTitle);
      if (!groups.has(info.year)) groups.set(info.year, []);
      groups.get(info.year).push({ item, info });
    });

    const fragment = document.createDocumentFragment();
    groups.forEach((entries, year) => {
      const section = document.createElement("section");
      section.className = "pm-year";

      const header = document.createElement("header");
      header.className = "pm-year-head";
      const yearTitle = document.createElement("strong");
      yearTitle.textContent = year;
      const count = document.createElement("span");
      count.textContent = `${entries.length} ${entries.length === 1 ? "mes" : "meses"}`;
      header.append(yearTitle, count);

      const months = document.createElement("div");
      months.className = "pm-month-list";
      entries.forEach(({ item }) => months.append(item));

      section.append(header, months);
      fragment.append(section);
    });

    list.replaceChildren(fragment);
    list.classList.add("pm-year-list");
    list.dataset.pmGrouped = "true";
  }

  function enhance() {
    if (currentRoute() !== ROUTE) return;
    const shell = document.querySelector("#managementContent .gf-shell");
    if (!shell) return;
    shell.classList.add("pm-paper-shell");

    const heroText = shell.querySelector(".gf-hero p");
    if (heroText) heroText.textContent = "Lectura destacada y biblioteca clínica organizada por mes.";

    enhanceFeatured(shell);
    enhanceRepository(shell);
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(enhance);
  }

  window.addEventListener("hashchange", schedule);
  window.addEventListener("crs:ui-section-ready", (event) => {
    if (event.detail?.route === ROUTE || currentRoute() === ROUTE) schedule();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
})();
