import * as THREE from '/three/build/three.module.js';
import { box, cyl, cylX, button, group } from '../model-utils.js';

const STEEL = 0x8a97a5;
const DARK = 0x6b7a86;
const RED = 0xd7263d;
const GREEN = 0x2f9e44;
const GUARD = 0x6fc3e0;
const BIT = 0xb8c2cc;

export function build() {
  const root = new THREE.Group();
  root.name = 'drill-press';
  const parts = [];

  function meta(id, nameZh, nameEn, p, danger, description, safetyNote, relatedRules) {
    parts.push({
      id, nameZh, nameEn,
      description, safetyNote, relatedRules,
      danger: danger || 'info',
      hotspotPosition: [p.x ?? 0, p.y ?? 0, p.z ?? 0]
    });
  }

  // Base (底座)
  box(root, 'base', 0.7, 0.2, 0.5, STEEL, { x: 0, y: 0.1, z: 0 });
  meta('base', '底座', 'Base', { x: 0, y: 0.1, z: 0 }, 'info',
    '支撑整台钻床的底座，保证设备稳定。',
    '保持底座和周边整洁，不得堆放杂物。', [17, 20]);

  // Column (立柱)
  cyl(root, 'column', 0.12, 0.12, 1.6, DARK, { x: -0.25, y: 0.95, z: 0 });
  meta('column', '立柱', 'Column', { x: -0.25, y: 0.95, z: 0 }, 'info',
    '支撑机头和主轴箱的立柱。',
    '一台钻床只由一名指定人员操作。', [18]);

  // Table (工作台)
  cyl(root, 'table', 0.32, 0.32, 0.08, STEEL, { x: 0.15, y: 0.7, z: 0 });
  meta('table', '工作台', 'Table', { x: 0.15, y: 0.7, z: 0 }, 'info',
    '放置工件和夹具的工作台面。',
    '工件必须用台虎钳或夹具可靠夹紧，严禁用手扶持。', [6]);

  // Vise (平口钳)
  box(root, 'vise', 0.28, 0.1, 0.24, DARK, { x: 0.15, y: 0.79, z: 0 });
  box(root, 'vise', 0.06, 0.08, 0.2, STEEL, { x: 0.15, y: 0.83, z: 0.06 });
  meta('vise', '平口钳', 'Vise', { x: 0.15, y: 0.79, z: 0 }, 'info',
    '夹持工件的台虎钳，防止工件旋转时飞脱。',
    '尤其是小工件，必须用台虎钳或夹具夹紧。', [6]);

  // Head (机头)
  box(root, 'head', 0.4, 0.35, 0.5, STEEL, { x: -0.25, y: 1.85, z: 0 });
  meta('head', '机头', 'Head', { x: -0.25, y: 1.85, z: 0 }, 'info',
    '装有主轴和电机、位于立柱顶部的机头。',
    '出现异常声响或振动时立即停机并报告。', [16]);

  // Spindle (主轴)
  cyl(root, 'spindle', 0.07, 0.07, 0.35, STEEL, { x: 0.15, y: 1.5, z: 0 });
  meta('spindle', '主轴', 'Spindle', { x: 0.15, y: 1.5, z: 0 }, 'danger',
    '带动钻夹头和钻头旋转的主轴。',
    '主轴旋转时严禁戴手套或触摸。', [3, 15]);

  // Drill chuck (钻夹头) — grouped with a key-hole bump so rotation is visible.
  const chuckG = group(root, 'drill-chuck', { x: 0.15, y: 1.28, z: 0 });
  cyl(chuckG, 'drill-chuck', 0.1, 0.1, 0.16, DARK, { x: 0, y: 0, z: 0 });
  box(chuckG, 'drill-chuck', 0.03, 0.07, 0.06, DARK, { x: 0, y: 0, z: 0.1 });
  meta('drill-chuck', '钻夹头', 'Drill Chuck', { x: 0.15, y: 1.28, z: 0 }, 'info',
    '夹持钻头的夹头。',
    '装拆钻头后必须立即取下钻夹头钥匙。', [5, 8]);

  // Drill bit (钻头) — grouped with two flute strips so rotation is visible.
  const bitG = group(root, 'drill-bit', { x: 0.15, y: 1.0, z: 0 });
  cyl(bitG, 'drill-bit', 0.03, 0.05, 0.5, BIT, { x: 0, y: 0, z: 0 });
  box(bitG, 'drill-bit', 0.024, 0.4, 0.024, DARK, { x: 0.04, y: -0.03, z: 0 });
  box(bitG, 'drill-bit', 0.024, 0.4, 0.024, DARK, { x: -0.04, y: -0.03, z: 0 });
  meta('drill-bit', '钻头', 'Drill Bit', { x: 0.15, y: 1.0, z: 0 }, 'danger',
    '高速旋转的切削钻头。',
    '钻头旋转时严禁戴手套，手套可能被卷入。', [3]);

  // Guard (防护罩)
  cyl(root, 'guard', 0.16, 0.16, 0.7, GUARD, { x: 0.15, y: 1.1, z: 0 }, { transparent: true, opacity: 0.25 }, 20);
  meta('guard', '防护罩', 'Guard', { x: 0.15, y: 1.1, z: 0 }, 'danger',
    '罩住钻头的透明防护罩。',
    '开机前检查防护罩，严禁拆除或绕过。', [5, 10]);

  // Feed handle (进给手柄)
  const handleG = group(root, 'feed-handle', { x: -0.45, y: 1.85, z: 0.2 });
  cylX(handleG, 'feed-handle', 0.03, 0.5, STEEL, { x: 0, y: 0, z: 0 });
  cylX(handleG, 'feed-handle', 0.03, 0.22, STEEL, { x: 0, y: 0, z: 0, rz: Math.PI / 2 });
  box(handleG, 'feed-handle', 0.05, 0.05, 0.05, DARK, { x: 0.25, y: 0, z: 0 });
  meta('feed-handle', '进给手柄', 'Feed Handle', { x: -0.45, y: 1.85, z: 0.2 }, 'info',
    '控制钻头上下进给的手柄。',
    '运转中不离岗，调整进给前先停机。', [15]);

  // Emergency stop (急停按钮)
  button(root, 'emergency-stop', 0.08, 0.1, RED, { x: -0.25, y: 1.95, z: 0.26 });
  meta('emergency-stop', '急停按钮', 'Emergency Stop', { x: -0.25, y: 1.95, z: 0.26 }, 'control',
    '红色急停按钮，遇危险立即按下。',
    '遇危险立即按下急停，再关闭电源并报告教师。', [7]);

  // Power switch (电源开关)
  box(root, 'power-switch', 0.1, 0.14, 0.04, GREEN, { x: -0.25, y: 1.75, z: 0.26 });
  meta('power-switch', '电源开关', 'Power Switch', { x: -0.25, y: 1.75, z: 0.26 }, 'control',
    '控制钻床电源通断的开关。',
    '结束加工或离开时必须停机并关闭电源。', [7, 15]);

  return { root, parts };
}
