/**
 * Sets <html data-theme> before first paint so the page never flashes the
 * wrong theme. Reads the stored choice ("tz-theme"), falling back to the OS
 * preference. Rendered as the first element of <body> in both document roots
 * (public locale layout and admin layout).
 */
const script = `(function(){try{var t=localStorage.getItem("tz-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
