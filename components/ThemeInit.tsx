// Runs before hydration/paint to avoid a flash of the wrong theme.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem('ffl-theme');
    var t = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
`;

export default function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
