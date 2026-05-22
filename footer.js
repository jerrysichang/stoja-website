/**
 * Shared site footer — single source of markup for all pages.
 */
(function initSiteFooter() {
  const APP_STORE_URL = "https://apps.apple.com/us/app/stoja/id6761839249?mt=12";
  const script =
    document.currentScript || document.querySelector('script[src*="footer.js"]');
  const scriptSrc = script?.getAttribute("src") || "";
  const inPagesDir = scriptSrc.startsWith("../");
  const pages = inPagesDir ? "./" : "./pages/";
  const year = new Date().getFullYear();

  const markup = `
    <div class="container footer-layout">
      <nav class="footer-nav" aria-label="Footer primary">
        <a class="link-muted" href="${pages}support.html">Support</a>
        <a class="link-muted" href="${APP_STORE_URL}" target="_blank" rel="noopener noreferrer">Download</a>
      </nav>
      <div class="footer-meta">
        <span class="muted">© ${year} Stoja</span>
        <a class="link-muted" href="${pages}legal.html">Legal</a>
        <a class="link-muted" href="${pages}terms.html">Terms of use</a>
        <a class="link-muted" href="${pages}privacy.html">Privacy policy</a>
      </div>
    </div>
  `;

  const footer = document.querySelector("[data-site-footer]") || document.querySelector(".site-footer");
  if (!footer) return;

  footer.classList.add("site-footer");
  footer.innerHTML = markup;
})();
