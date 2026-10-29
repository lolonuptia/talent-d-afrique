// @ts-nocheck
export function initShellEffects() {
  let last = null;
  const run = () => {
    if (!window.matchMedia("(max-width:800px)").matches) return;
    const a = document.querySelector(".side a.active");
    if (!a || a === last) return;
    last = a;
    const side = a.closest(".side");
    if (!side) return;
    side.scrollTo({ left: a.offsetLeft - side.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
  };
  new MutationObserver(run).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
}