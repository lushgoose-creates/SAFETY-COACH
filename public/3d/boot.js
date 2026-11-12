// Lazy bootstrap for the 3D blueprint viewer. Loads the (heavy) three.js code
// only when the panel is visible, and exposes window.SafetyCoach3D.
(() => {
  const panel = document.getElementById('blueprint-panel');
  const toggle = document.getElementById('blueprint-toggle');
  const viewer = document.getElementById('blueprint-viewer');
  if (!panel || !toggle || !viewer) return;

  const { t } = window.SafetyCoachI18n;
  const machineId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop());

  let api = null;
  let loadPromise = null;

  function setCollapsed(collapsed) {
    panel.dataset.collapsed = String(collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    const label = toggle.querySelector('span');
    if (label) label.textContent = t(collapsed ? 'blueprintExpand' : 'blueprintCollapse');
    if (api && !collapsed) api.onShow();
  }

  function showFallback() {
    viewer.replaceChildren();
    const fallback = document.createElement('div');
    fallback.className = 'blueprint-fallback';
    fallback.textContent = t('blueprintFallback');
    viewer.appendChild(fallback);
  }

  function loadViewer() {
    if (loadPromise) return loadPromise;
    loadPromise = import('./viewer.js')
      .then((mod) => mod.createBlueprintViewer(viewer, machineId))
      .then((instance) => {
        api = instance;
        window.SafetyCoach3D = instance;
        return instance;
      })
      .catch((error) => {
        console.error('3D viewer failed to load:', error);
        showFallback();
        loadPromise = null;
        throw error;
      });
    return loadPromise;
  }

  window.getSafetyCoach3D = loadViewer;

  toggle.addEventListener('click', () => {
    const collapsed = panel.dataset.collapsed === 'true';
    const next = !collapsed;
    setCollapsed(next);
    if (!next) loadViewer().catch(() => {});
  });

  if (panel.dataset.collapsed !== 'true') {
    loadViewer().catch(() => {});
  }
})();
