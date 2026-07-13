/**
 * Sets <html data-theme> before first paint so the page never flashes the
 * wrong theme. Reads the stored choice ("tz-theme"), falling back to the OS
 * preference. Rendered at the top of <body> in both document roots.
 *
 * The `async` attribute is what keeps React 19 quiet: without it, React warns
 * that a sync <script> "is never executed when rendering on the client" every
 * time a layout re-renders (e.g. switching locale re-renders [locale]/layout).
 * `async` has NO effect on an inline script in the browser — the HTML spec only
 * honours async/defer for external `src` scripts — so it still runs
 * synchronously at parse time, before the body paints. React just sees it as an
 * async script it doesn't need to warn about.
 */
const script = `(function(){try{var t=localStorage.getItem("tz-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function ThemeScript() {
  return <script async dangerouslySetInnerHTML={{ __html: script }} />;
}
