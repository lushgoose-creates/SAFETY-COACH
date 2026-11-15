import * as THREE from '/three/build/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const MODEL_LOADERS = {
  lathe: () => import('./machines3d/lathe.js'),
  'drill-press': () => import('./machines3d/drill-press.js')
};

const BLUEPRINT_BG = 0x0b1e3a;
const FACE_BLUEPRINT = 0x123456;
const WIRE_CYAN = 0x53d6f0;
const WIRE_DIM = 0x33495e;

// Local reference images for PPE-related rules (shown bottom-right of the viewer).
const PPE_IMAGES = {
  goggles: '/3d/ppe/goggles.jpg',
  hair: '/3d/ppe/hair.jpg',
  gloves: '/3d/ppe/gloves.jpg'
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

export async function createBlueprintViewer(container, machineId) {
  const { t, lang } = window.SafetyCoachI18n;

  if (!webglAvailable()) {
    const fallback = document.createElement('div');
    fallback.className = 'blueprint-fallback';
    fallback.textContent = t('blueprintFallback');
    container.replaceChildren(fallback);
    return { available: false, dispose() {} };
  }

  const loader = MODEL_LOADERS[machineId] || MODEL_LOADERS.lathe;
  let modelModule;
  try {
    modelModule = await loader();
  } catch (error) {
    const fallback = document.createElement('div');
    fallback.className = 'blueprint-fallback';
    fallback.textContent = t('blueprintFallback');
    container.replaceChildren(fallback);
    console.error('3D model failed to build:', error);
    return { available: false, dispose() {} };
  }

  // Renderer (three.js r187 requires WebGL2)
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    console.error('WebGL2 unavailable:', error);
    const fallback = document.createElement('div');
    fallback.className = 'blueprint-fallback';
    fallback.textContent = t('blueprintFallback');
    container.replaceChildren(fallback);
    return { available: false, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BLUEPRINT_BG);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 200);
  camera.up.set(0, 1, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;

  // Lights (only used by solid mode)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223, 0.7));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(6, 10, 8);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xbfd8ff, 0.5);
  fillLight.position.set(-5, 3, -4);
  scene.add(fillLight);

  // Grid floor
  const grid = new THREE.GridHelper(40, 40, 0x2a5a80, 0x16324d);
  grid.position.y = -0.03;
  scene.add(grid);

  // Build model
  const { root, parts } = modelModule.build();
  scene.add(root);

  const bbox = new THREE.Box3().setFromObject(root);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.5);

  controls.target.copy(center);
  camera.position.set(center.x + maxDim * 1.32, center.y + maxDim * 0.9, center.z + maxDim * 1.65);
  controls.minDistance = maxDim * 0.5;
  controls.maxDistance = maxDim * 8;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.update();

  scene.fog = new THREE.Fog(BLUEPRINT_BG, maxDim * 4, maxDim * 14);

  // Shared materials
  const blueprintFaceMaterial = new THREE.MeshBasicMaterial({
    color: FACE_BLUEPRINT, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide
  });
  const wireCyan = new THREE.LineBasicMaterial({ color: WIRE_CYAN });
  const wireDim = new THREE.LineBasicMaterial({ color: WIRE_DIM });

  // Collect meshes + generate blueprint edges
  const meshes = [];
  const wires = [];
  const partWires = new Map();
  const partRoots = new Map();
  root.traverse((obj) => {
    const pid = obj.userData && obj.userData.partId;
    if (pid && !partRoots.has(pid)) partRoots.set(pid, obj);
    if (!obj.isMesh) return;
    const partId = obj.userData.partId || 'default';
    meshes.push({ mesh: obj, partId, solidMaterial: obj.material });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry, 30), wireCyan);
    obj.add(edges);
    wires.push(edges);
    if (!partWires.has(partId)) partWires.set(partId, []);
    partWires.get(partId).push(edges);
  });

  // Construction-animation data: keep each part's top-level objects and their
  // base positions, so parts can fly into place rather than just appearing.
  const partRootsList = new Map();
  root.traverse((obj) => {
    const pid = obj.userData && obj.userData.partId;
    if (!pid) return;
    const parent = obj.parent;
    if (parent && parent.userData && parent.userData.partId === pid) return;
    if (!partRootsList.has(pid)) partRootsList.set(pid, []);
    partRootsList.get(pid).push(obj);
  });
  const partBasePos = new Map();
  for (const [pid, objs] of partRootsList) partBasePos.set(pid, objs.map((o) => o.position.clone()));
  const partMeta = new Map();
  for (const p of parts) partMeta.set(p.id, p);
  const partOrder = parts.map((p) => p.id);
  const assembleDrop = maxDim * 0.6;
  const raycastTargets = meshes.map((m) => m.mesh);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hoverAnchor = new THREE.Vector3();
  let hoverHideTimer = 0;

  let blueprint = true;
  const highlightColors = { yellow: 0xffd429, red: 0xff5252, green: 0x39d98a };
  const highlightMaterials = {};
  for (const [k, c] of Object.entries(highlightColors)) highlightMaterials[k] = new THREE.LineBasicMaterial({ color: c });
  const highlightedWires = new Set();
  function setPartHighlight(partId, color) {
    const ws = partWires.get(partId) || [];
    const mat = highlightMaterials[color] || highlightMaterials.yellow;
    for (const w of ws) { w.material = mat; highlightedWires.add(w); }
  }
  function clearHighlights() {
    highlightedWires.clear();
    applyStyle();
  }
  function applyStyle() {
    for (const { mesh, solidMaterial } of meshes) {
      mesh.material = blueprint ? blueprintFaceMaterial : solidMaterial;
    }
    const wireMat = blueprint ? wireCyan : wireDim;
    for (const wire of wires) if (!highlightedWires.has(wire)) wire.material = wireMat;
  }
  applyStyle();

  let demoActive = false;
  let demoSpins = [];
  let powerOn = false;
  let powerSpins = [];
  let assembling = false;
  let assemblePaused = false;
  let assembleIndex = 0;
  let assembleProgress = 0;
  let assembleGapTimer = 0;
  let currentLabelPart = null;
  let currentLabelAnchor = null;
  const ASSEMBLE_DUR = 1400;
  const ASSEMBLE_GAP = 300;
  let lastTime = performance.now();

  // Camera presets
  const presets = {
    front: new THREE.Vector3(center.x, center.y + maxDim * 0.12, center.z + maxDim * 1.65),
    side: new THREE.Vector3(center.x + maxDim * 1.65, center.y + maxDim * 0.12, center.z),
    top: new THREE.Vector3(center.x, center.y + maxDim * 1.7, center.z + maxDim * 0.01),
    iso: new THREE.Vector3(center.x + maxDim * 1.32, center.y + maxDim * 0.9, center.z + maxDim * 1.65)
  };

  let fly = null;
  function flyTo(position, target = center) {
    fly = {
      startPos: camera.position.clone(),
      endPos: position.clone(),
      startTarget: controls.target.clone(),
      endTarget: target.clone(),
      start: performance.now(),
      dur: 600
    };
  }
  function focusPart(partId) {
    const obj = partRoots.get(partId);
    if (!obj) return;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    const offset = camera.position.clone().sub(controls.target);
    flyTo(p.clone().add(offset), p);
  }

  // Render loop
  let rafId = 0;
  let paused = false;
  let disposed = false;

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (disposed) return;
    if (paused) return;

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (fly) {
      const k = Math.min(1, (now - fly.start) / fly.dur);
      const e = easeInOutCubic(k);
      camera.position.lerpVectors(fly.startPos, fly.endPos, e);
      controls.target.lerpVectors(fly.startTarget, fly.endTarget, e);
      if (k >= 1) fly = null;
    }
    for (const s of demoSpins) s.obj.rotateOnWorldAxis(s.axis, s.speed * dt);
    for (const s of powerSpins) s.obj.rotateOnWorldAxis(s.axis, s.speed * dt);
    controls.update();
    if (assembling) {
      stepAssemble(dt);
      updateAssembleLabel();
    }
    updateHoverLabel();
    renderer.render(scene, camera);
  }

  // Auto-rotate until first interaction
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  const stopAutoRotate = () => { controls.autoRotate = false; controls.removeEventListener('start', stopAutoRotate); };
  controls.addEventListener('start', stopAutoRotate);

  // Visibility pause
  let intersecting = true;
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      intersecting = entries[0].isIntersecting;
      paused = disposed || !intersecting || document.hidden;
    }, { threshold: 0.01 });
    io.observe(container);
  }
  function onVisibility() { paused = disposed || !intersecting || document.hidden; }
  document.addEventListener('visibilitychange', onVisibility);

  // Resize
  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  window.addEventListener('orientationchange', resize);

  // Toolbar UI
  const controlsEl = document.createElement('div');
  controlsEl.className = 'bp-controls';
  const toolbar = document.createElement('div');
  toolbar.className = 'bp-toolbar';
  const addBtn = (label, key, onClick, activeClass) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bp-btn';
    b.textContent = label;
    if (key) b.dataset.bp = key;
    b.addEventListener('click', onClick);
    toolbar.appendChild(b);
    return b;
  };
  addBtn(t('blueprintFront'), 'front', () => flyTo(presets.front));
  addBtn(t('blueprintSide'), 'side', () => flyTo(presets.side));
  addBtn(t('blueprintTop'), 'top', () => flyTo(presets.top));
  addBtn(t('blueprintIso'), 'iso', () => flyTo(presets.iso));
  addBtn(t('blueprintReset'), 'reset', () => flyTo(presets.iso));
  const styleBtn = addBtn(t('blueprintSolid'), 'style', () => {
    blueprint = !blueprint;
    styleBtn.textContent = blueprint ? t('blueprintSolid') : t('blueprintWire');
    styleBtn.classList.toggle('is-active', !blueprint);
    applyStyle();
  });
  const powerBtn = addBtn(t('powerOn'), 'power', () => togglePower(!powerOn));
  controlsEl.appendChild(toolbar);
  container.appendChild(controlsEl);

  // Construction ("assemble") controls, pinned to the top-right of the viewer.
  const assembleBtn = document.createElement('button');
  assembleBtn.type = 'button';
  assembleBtn.className = 'bp-btn bp-assemble-btn';
  assembleBtn.textContent = t('blueprintAssemble');
  assembleBtn.addEventListener('click', () => {
    if (!assembling) startAssemble();
    else { assemblePaused = !assemblePaused; setAssembleButton(); }
  });
  const stopBtn = document.createElement('button');
  stopBtn.type = 'button';
  stopBtn.className = 'bp-btn bp-assemble-stop';
  stopBtn.textContent = t('blueprintAssembleStop');
  stopBtn.hidden = true;
  stopBtn.addEventListener('click', resetAssembleState);
  const assembleWrap = document.createElement('div');
  assembleWrap.className = 'bp-assemble';
  assembleWrap.append(assembleBtn, stopBtn);
  container.appendChild(assembleWrap);

  // Floating label that names the part currently being assembled.
  const label = document.createElement('div');
  label.className = 'bp-assemble-label';
  label.hidden = true;
  container.appendChild(label);

  // Tooltip label for the part under the pointer / touched.
  const hoverLabel = document.createElement('div');
  hoverLabel.className = 'bp-assemble-label bp-part-label';
  hoverLabel.hidden = true;
  container.appendChild(hoverLabel);

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  // Demo overlay (caption + badge, pinned to top)
  const overlayEl = document.createElement('div');
  overlayEl.className = 'bp-demo-overlay';
  overlayEl.hidden = true;
  const badgeEl = document.createElement('span');
  badgeEl.className = 'bp-demo-badge';
  const captionEl = document.createElement('span');
  captionEl.className = 'bp-demo-caption';
  const overlayClose = document.createElement('button');
  overlayClose.type = 'button';
  overlayClose.className = 'bp-demo-close';
  overlayClose.textContent = '✕';
  overlayClose.addEventListener('click', stopDemo);
  overlayEl.append(badgeEl, captionEl, overlayClose);
  container.appendChild(overlayEl);

  // Make the demo overlay draggable so it can be moved out of the way.
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOrigLeft = 0;
  let dragOrigTop = 0;
  overlayEl.addEventListener('pointerdown', (event) => {
    if (event.target === overlayClose) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    const parentRect = overlayEl.parentElement.getBoundingClientRect();
    const rect = overlayEl.getBoundingClientRect();
    dragOrigLeft = rect.left - parentRect.left;
    dragOrigTop = rect.top - parentRect.top;
    overlayEl.style.right = 'auto';
    overlayEl.setPointerCapture(event.pointerId);
  });
  overlayEl.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    overlayEl.style.left = `${dragOrigLeft + event.clientX - dragStartX}px`;
    overlayEl.style.top = `${dragOrigTop + event.clientY - dragStartY}px`;
  });
  const endDrag = () => { dragging = false; };
  overlayEl.addEventListener('pointerup', endDrag);
  overlayEl.addEventListener('pointercancel', endDrag);

  // PPE reference image, pinned to the bottom-right of the viewer.
  const ppeImgEl = document.createElement('div');
  ppeImgEl.className = 'bp-demo-ppe-img';
  ppeImgEl.hidden = true;
  container.appendChild(ppeImgEl);

  function showDemoOverlay(mode, text, ppe) {
    badgeEl.hidden = mode === 'info';
    badgeEl.textContent = mode === 'wrong' ? '✗ ' + t('demoWrong') : '✓ ' + t('demoCorrect');
    badgeEl.className = 'bp-demo-badge ' + (mode || 'info');
    captionEl.textContent = text;
    ppeImgEl.hidden = !(ppe && PPE_IMAGES[ppe]);
    ppeImgEl.innerHTML = '';
    if (ppe && PPE_IMAGES[ppe]) {
      const img = document.createElement('img');
      img.src = PPE_IMAGES[ppe];
      img.alt = ppe;
      ppeImgEl.appendChild(img);
    }
    overlayEl.hidden = false;
  }
  function applyPowerHighlight() {
    if (powerOn) setPartHighlight('power-switch', 'green');
  }
  function stopDemo() {
    demoActive = false;
    demoSpins = [];
    clearHighlights();
    applyPowerHighlight();
    overlayEl.hidden = true;
    ppeImgEl.hidden = true;
  }
  function playRuleDemo(machineId, ruleNumber, ruleText) {
    const def = window.SafetyCoachDemos && window.SafetyCoachDemos.getDemo(machineId, ruleNumber);
    if (!def) return false;
    stopDemo();
    demoActive = true;
    controls.autoRotate = false;
    focusPart(def.focus);
    const color = def.mode === 'wrong' ? 'red' : def.mode === 'correct' ? 'green' : 'yellow';
    for (const part of def.highlight) setPartHighlight(part, color);
    demoSpins = (def.spin || []).map((s) => {
      const obj = partRoots.get(s.part);
      if (!obj) return null;
      const axis = s.axis === 'x' ? new THREE.Vector3(1, 0, 0) : s.axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
      return { obj, axis, speed: ((s.rpm || 70) * Math.PI * 2) / 60 };
    }).filter(Boolean);
    showDemoOverlay(def.mode, ruleText, def.ppe);
    return true;
  }

  function togglePower(on) {
    powerOn = on;
    if (on) {
      stopDemo();
      const def = window.SafetyCoachDemos && window.SafetyCoachDemos.getPowerOn(machineId);
      powerSpins = def ? (def.spin || []).map((s) => {
        const obj = partRoots.get(s.part);
        if (!obj) return null;
        const axis = s.axis === 'x' ? new THREE.Vector3(1, 0, 0) : s.axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        return { obj, axis, speed: ((s.rpm || 120) * Math.PI * 2) / 60 };
      }).filter(Boolean) : [];
      if (def && def.highlight) for (const part of def.highlight) setPartHighlight(part, 'green');
      controls.autoRotate = false;
    } else {
      powerSpins = [];
      clearHighlights();
    }
    powerBtn.textContent = powerOn ? t('powerOff') : t('powerOn');
    powerBtn.classList.toggle('is-powered', powerOn);
  }

  function applyAssemblePart(partId, progress) {
    const objs = partRootsList.get(partId);
    if (!objs) return;
    const bases = partBasePos.get(partId);
    const e = easeOutCubic(Math.min(1, Math.max(0, progress)));
    const offset = assembleDrop * (1 - e);
    objs.forEach((obj, i) => {
      const b = bases[i];
      obj.position.set(b.x, b.y + offset, b.z);
      obj.scale.setScalar(e);
    });
  }

  function hideAllParts() {
    for (const [pid, objs] of partRootsList) {
      const bases = partBasePos.get(pid);
      objs.forEach((obj, i) => {
        obj.position.set(bases[i].x, bases[i].y + assembleDrop, bases[i].z);
        obj.scale.setScalar(0);
      });
    }
  }

  function setAssembleButton() {
    stopBtn.hidden = !assembling;
    if (!assembling) {
      assembleBtn.textContent = t('blueprintAssemble');
      assembleBtn.classList.remove('is-playing');
    } else if (assemblePaused) {
      assembleBtn.textContent = t('blueprintResume');
      assembleBtn.classList.add('is-playing');
    } else {
      assembleBtn.textContent = t('blueprintPause');
      assembleBtn.classList.add('is-playing');
    }
  }

  function resetAssembleState() {
    assembling = false;
    assemblePaused = false;
    assembleIndex = 0;
    assembleProgress = 0;
    assembleGapTimer = 0;
    currentLabelPart = null;
    currentLabelAnchor = null;
    label.hidden = true;
    for (const [pid, objs] of partRootsList) {
      const bases = partBasePos.get(pid);
      objs.forEach((obj, i) => {
        obj.position.copy(bases[i]);
        obj.scale.setScalar(1);
      });
    }
    setAssembleButton();
  }

  function startAssemble() {
    stopDemo();
    if (powerOn) togglePower(false);
    clearHighlights();
    controls.autoRotate = false;
    hideAllParts();
    assembling = true;
    assemblePaused = false;
    assembleIndex = 0;
    assembleProgress = 0;
    assembleGapTimer = 0;
    currentLabelPart = null;
    currentLabelAnchor = null;
    label.hidden = true;
    setAssembleButton();
    flyTo(presets.iso);
  }

  function stepAssemble(dt) {
    if (assemblePaused) return;
    if (assembleGapTimer > 0) {
      assembleGapTimer -= dt * 1000;
      if (assembleGapTimer <= 0) {
        assembleGapTimer = 0;
        assembleIndex += 1;
        assembleProgress = 0;
        currentLabelPart = null;
      }
      return;
    }
    if (assembleIndex >= partOrder.length) {
      resetAssembleState();
      return;
    }
    const partId = partOrder[assembleIndex];
    assembleProgress += (dt * 1000) / ASSEMBLE_DUR;
    const p = Math.min(1, assembleProgress);
    applyAssemblePart(partId, p);
    if (currentLabelPart !== partId) {
      currentLabelPart = partId;
      const meta = partMeta.get(partId);
      if (meta && meta.hotspotPosition) {
        label.textContent = lang === 'en' ? meta.nameEn : meta.nameZh;
        currentLabelAnchor = new THREE.Vector3(meta.hotspotPosition[0], meta.hotspotPosition[1], meta.hotspotPosition[2]);
        label.hidden = false;
      }
    }
    if (assembleProgress >= 1) {
      assembleProgress = 1;
      assembleGapTimer = ASSEMBLE_GAP;
    }
  }

  function updateAssembleLabel() {
    if (!assembling || !currentLabelAnchor) { label.hidden = true; return; }
    const v = currentLabelAnchor.clone().project(camera);
    if (v.z > 1) { label.hidden = true; return; }
    const x = (v.x * 0.5 + 0.5) * container.clientWidth;
    const y = (-v.y * 0.5 + 0.5) * container.clientHeight;
    label.hidden = false;
    label.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - 18}px)`;
  }

  function setPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function partAtPointer() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    if (!hits.length) return null;
    const partId = hits[0].object.userData.partId;
    if (!partId) return null;
    return { partId, point: hits[0].point.clone() };
  }

  function showHoverLabel(partId, point) {
    const meta = partMeta.get(partId);
    if (!meta) { hideHoverLabel(); return; }
    hoverLabel.textContent = lang === 'en' ? meta.nameEn : meta.nameZh;
    hoverAnchor.copy(point);
    hoverLabel.hidden = false;
  }

  function hideHoverLabel() {
    if (hoverHideTimer) { clearTimeout(hoverHideTimer); hoverHideTimer = 0; }
    hoverLabel.hidden = true;
  }

  function onPointerMove(event) {
    setPointer(event);
    if (hoverHideTimer) { clearTimeout(hoverHideTimer); hoverHideTimer = 0; }
    const hit = partAtPointer();
    if (hit) showHoverLabel(hit.partId, hit.point);
    else hideHoverLabel();
  }

  function onPointerDown(event) {
    setPointer(event);
    const hit = partAtPointer();
    if (!hit) { hideHoverLabel(); return; }
    showHoverLabel(hit.partId, hit.point);
    if (hoverHideTimer) clearTimeout(hoverHideTimer);
    hoverHideTimer = setTimeout(hideHoverLabel, 3000);
  }

  function onPointerLeave() {
    hideHoverLabel();
  }

  function updateHoverLabel() {
    if (hoverLabel.hidden) return;
    const v = hoverAnchor.clone().project(camera);
    if (v.z > 1) { hoverLabel.hidden = true; return; }
    const x = (v.x * 0.5 + 0.5) * container.clientWidth;
    const y = (-v.y * 0.5 + 0.5) * container.clientHeight;
    hoverLabel.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - 14}px)`;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    controls.removeEventListener('start', stopAutoRotate);
    controls.dispose();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    for (const entry of meshes) {
      if (entry.solidMaterial && entry.solidMaterial !== blueprintFaceMaterial) {
        entry.solidMaterial.dispose();
      }
    }
    [blueprintFaceMaterial, wireCyan, wireDim, ...Object.values(highlightMaterials)].forEach((m) => m.dispose());
    grid.geometry.dispose();
    (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach((m) => m.dispose());
    overlayEl.remove();
    assembleWrap.remove();
    label.remove();
    hoverLabel.remove();
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    renderer.dispose();
    renderer.domElement.remove();
    controlsEl.remove();
  }

  rafId = requestAnimationFrame(loop);

  return {
    available: true,
    parts,
    dispose,
    resize,
    setBlueprint(value) {
      blueprint = !!value;
      styleBtn.textContent = blueprint ? t('blueprintSolid') : t('blueprintWire');
      styleBtn.classList.toggle('is-active', !blueprint);
      applyStyle();
    },
    cameraPreset(name) {
      if (presets[name]) flyTo(presets[name]);
    },
    playRuleDemo,
    stopDemo,
    onShow() {
      resize();
    }
  };
}
