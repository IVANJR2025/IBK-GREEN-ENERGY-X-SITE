/* ============================================================
   IBK GREEN ENERGY X — Interações globais
   - Painéis empilhados (o conteúdo seguinte "entra por dentro" do anterior)
   - Revelação ao scroll
   - Menu móvel
   - Fallback de extensão de imagens (.jpg → .png → .jpeg → .webp)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Fallback de extensões de imagem ---------- */
  const EXTS = ["jpg", "png", "jpeg", "webp", "JPG", "PNG"];
  document.querySelectorAll("img[data-img]").forEach((img) => {
    const base = img.getAttribute("data-img");
    let i = 0;
    const tryNext = () => {
      if (i >= EXTS.length) { img.style.display = "none"; return; }
      img.src = `${base}.${EXTS[i++]}`;
    };
    img.addEventListener("error", tryNext);
    tryNext();
  });

  /* ---------- Menu móvel ---------- */
  const burger = document.querySelector(".nav-burger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  /* ---------- Revelação ao scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Painéis empilhados ----------
     Cada .panel é sticky; quando o painel seguinte começa a cobri-lo,
     o anterior encolhe e escurece ligeiramente — sensação de "entrar
     por dentro" do conteúdo. */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const panels = Array.from(document.querySelectorAll(".stack .panel"));

  if (panels.length > 1 && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      panels.forEach((panel, idx) => {
        const next = panels[idx + 1];
        if (!next) return;
        const nextTop = next.getBoundingClientRect().top;
        const vh = window.innerHeight;
        // progresso da cobertura: 1 quando o próximo painel chega ao topo
        const progress = Math.min(Math.max(1 - nextTop / vh, 0), 1);
        const scale = 1 - progress * 0.06;
        const dim = progress * 0.35;
        panel.style.transform = `scale(${scale})`;
        panel.style.filter = `brightness(${1 - dim})`;
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }
});
