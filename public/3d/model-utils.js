import * as THREE from '/three/build/three.module.js';

// Procedural part helpers. Every mesh is tagged with userData.partId so the
// viewer can group meshes by part for highlighting, and can generate the
// blueprint wireframe edges automatically.

export function place(obj, p = {}) {
  obj.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
  if (p.rx) obj.rotation.x = p.rx;
  if (p.ry) obj.rotation.y = p.ry;
  if (p.rz) obj.rotation.z = p.rz;
  return obj;
}

export function solidMaterial(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.35,
    roughness: opts.roughness ?? 0.5,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide
  });
}

export function box(parent, partId, w, h, d, color, p = {}, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), solidMaterial(color, opts));
  m.userData.partId = partId;
  place(m, p);
  parent.add(m);
  return m;
}

export function cyl(parent, partId, rTop, rBottom, height, color, p = {}, opts = {}, segments = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, segments), solidMaterial(color, opts));
  m.userData.partId = partId;
  place(m, p);
  parent.add(m);
  return m;
}

// Cylinder whose axis runs along X (the default cylinder axis is Y).
export function cylX(parent, partId, r, height, color, p = {}, opts = {}, segments = 24) {
  return cyl(parent, partId, r, r, height, color, { ...p, rz: -Math.PI / 2 }, opts, segments);
}

// A rounded "mushroom" button (cylinder cap) for the emergency stop.
export function button(parent, partId, r, h, color, p = {}) {
  return cyl(parent, partId, r, r, h, color, { ...p, rz: -Math.PI / 2 }, {}, 24);
}

export function group(root, partId, p = {}) {
  const g = new THREE.Group();
  g.name = partId;
  g.userData.partId = partId;
  place(g, p);
  root.add(g);
  return g;
}
