/**
 * Sets <html data-theme> before first paint so the page never flashes the
 * wrong theme. Reads the stored choice ("tz-theme"), falling back to the OS
 * preference. Rendered inside <head> in both document roots — React 19 treats
 * <head> children as managed, deduplicated resources, so re-rendering a layout
 * (e.g. switching locale re-renders [locale]/layout) does not re-execute or
 * warn about it, unlike a raw <script> in the <body>.
 */
const script = `(function(){try{var t=localStorage.getItem("tz-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
