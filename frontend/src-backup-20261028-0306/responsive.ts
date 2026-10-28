/** Ajoute data-label à chaque cellule pour pouvoir afficher les tableaux en cartes sur mobile. */
export function initResponsiveTables() {
  const label = () => {
    document.querySelectorAll<HTMLTableElement>("table").forEach((t) => {
      const heads = Array.from(t.querySelectorAll("thead th")).map((h) => (h.textContent || "").trim());
      t.querySelectorAll("tbody tr").forEach((tr) => {
        Array.from(tr.children).forEach((td, i) => {
          if (td.hasAttribute("data-label")) return;
          td.setAttribute("data-label", td.getAttribute("colspan") ? "" : heads[i] || "");
        });
      });
      t.classList.add("rt");
    });
  };
  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(label);
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  schedule();
}