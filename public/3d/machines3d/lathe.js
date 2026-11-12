import * as THREE from '/three/build/three.module.js';
import { box, cyl, cylX, button, group } from '../model-utils.js';

const STEEL = 0x8a97a5;
const DARK = 0x6b7a86;
const PANEL = 0x3a4a5a;
const RED = 0xd7263d;
const GREEN = 0x2f9e44;
const GUARD = 0x6fc3e0;
const TRAY = 0x55626e;
const COOLANT = 0x4a90c4;
const WORKPIECE = 0xb8c2cc;

export function build() {
  const root = new THREE.Group();
  root.name = 'lathe';
  const parts = [];

  function meta(id, nameZh, nameEn, p, danger, description, safetyNote, relatedRules) {
    parts.push({
      id, nameZh, nameEn,
      description, safetyNote, relatedRules,
      danger: danger || 'info',
      hotspotPosition: [p.x ?? 0, p.y ?? 0, p.z ?? 0]
    });
  }

  // Bed (床身) — long base + two rails
  const bedG = group(root, 'bed');
  box(bedG, 'bed', 4.4, 0.5, 0.7, STEEL, { x: 0, y: 0.25, z: 0 });
  box(bedG, 'bed', 4.2, 0.08, 0.12, DARK, { x: 0, y: 0.56, z: -0.22 });
  box(bedG, 'bed', 4.2, 0.08, 0.12, DARK, { x: 0, y: 0.56, z: 0.22 });
  meta('bed', '床身', 'Bed', { x: 0, y: 0.3, z: 0 }, 'info',
    '支撑整台车床的长条形底座，上面有两条导轨。',
    '严禁倚靠床身，不得在导轨上放置工具或杂物。', [19, 21]);

  // Chip tray (铁屑盘)
  box(root, 'chip-tray', 4.4, 0.1, 0.95, TRAY, { x: 0, y: 0.02, z: 0 });
  meta('chip-tray', '铁屑盘', 'Chip Tray', { x: 0, y: 0.05, z: 0.3 }, 'info',
    '承接切削时掉落的切屑和冷却液的托盘。',
    '切屑必须停机后用钩具清理，严禁徒手拉扯。', [14, 20]);

  // Headstock (主轴箱)
  box(root, 'headstock', 0.9, 0.9, 0.8, STEEL, { x: -1.9, y: 0.95, z: 0 });
  meta('headstock', '主轴箱', 'Headstock', { x: -1.9, y: 0.95, z: 0 }, 'info',
    '装有主轴和传动机构的箱体，位于床身左端。',
    '出现异常声响或振动时应立即停机并报告。', [16]);

  // Spindle (主轴)
  cylX(root, 'spindle', 0.12, 0.55, STEEL, { x: -1.38, y: 1.0, z: 0 });
  meta('spindle', '主轴', 'Spindle', { x: -1.38, y: 1.0, z: 0 }, 'danger',
    '带动卡盘和工件旋转的动力轴。',
    '旋转时严禁触摸，严禁用手或物品制动。', [3, 12, 13]);

  // Chuck (卡盘) + 3 jaws (卡爪)
  const chuckG = group(root, 'chuck', { x: -0.95, y: 1.0, z: 0 });
  cylX(chuckG, 'chuck', 0.28, 0.18, DARK, { x: 0, y: 0, z: 0 });
  const jawR = 0.16;
  const jawPositions = [
    { y: jawR, z: 0 },
    { y: -jawR * 0.5, z: jawR * 0.866 },
    { y: -jawR * 0.5, z: -jawR * 0.866 }
  ];
  for (const jp of jawPositions) {
    box(chuckG, 'chuck', 0.14, 0.1, 0.09, STEEL, { x: 0.1, y: jp.y, z: jp.z });
  }
  meta('chuck', '卡盘', 'Chuck', { x: -0.95, y: 1.0, z: 0 }, 'danger',
    '夹持工件的三爪卡盘，随主轴高速旋转。',
    '旋转时严禁戴手套、触摸或靠近，装夹后必须取下卡盘钥匙。', [3, 7, 8]);

  // Chuck key (卡盘钥匙) — separate T-shaped object resting beside the chuck
  const keyG = group(root, 'chuck-key', { x: -0.7, y: 0.55, z: 0.55 });
  cyl(keyG, 'chuck-key', 0.04, 0.04, 0.28, STEEL, { x: 0, y: 0.14, z: 0 });
  cylX(keyG, 'chuck-key', 0.025, 0.18, STEEL, { x: 0, y: 0, z: 0 });
  box(keyG, 'chuck-key', 0.05, 0.05, 0.12, DARK, { x: 0.05, y: 0, z: 0 });
  meta('chuck-key', '卡盘钥匙', 'Chuck Key', { x: -0.7, y: 0.55, z: 0.55 }, 'danger',
    '用于拧紧卡盘卡爪的 T 形工具。',
    '装夹完成后必须立即取下卡盘钥匙，确认离开卡盘后才能启动。', [8]);

  // Chuck guard (卡盘防护罩) — semi-transparent hinged cover above the chuck
  box(root, 'chuck-guard', 0.6, 0.45, 0.02, GUARD, { x: -0.95, y: 1.55, z: -0.25, rz: 0.5 }, { transparent: true, opacity: 0.35 });
  meta('chuck-guard', '卡盘防护罩', 'Chuck Guard', { x: -0.95, y: 1.5, z: -0.25 }, 'danger',
    '罩在卡盘上方的半透明防护罩。',
    '防护罩必须处于规定位置，严禁拆除或绕过。', [5, 10]);

  // Workpiece (工件)
  cylX(root, 'workpiece', 0.08, 0.95, WORKPIECE, { x: -0.35, y: 1.0, z: 0 });
  meta('workpiece', '工件', 'Workpiece', { x: -0.35, y: 1.0, z: 0 }, 'danger',
    '被卡盘夹持并随主轴旋转的待加工零件。',
    '工件必须夹紧，旋转时严禁触摸、测量或擦拭。', [7, 12]);

  // Carriage / saddle (大拖板)
  box(root, 'carriage', 0.7, 0.32, 0.85, STEEL, { x: 0.15, y: 0.92, z: 0 });
  meta('carriage', '大拖板', 'Carriage', { x: 0.15, y: 0.9, z: 0 }, 'danger',
    '沿床身导轨移动的拖板，带动刀具纵向进给。',
    '移动部件运行中不得触碰，设备运转时不得离岗。', [15, 18]);

  // Cross slide (中拖板)
  box(root, 'cross-slide', 0.4, 0.16, 0.6, DARK, { x: 0.15, y: 1.16, z: 0 });
  meta('cross-slide', '中拖板', 'Cross Slide', { x: 0.15, y: 1.16, z: 0 }, 'info',
    '位于大拖板之上、带动刀具横向进给的滑板。',
    '刀具和刀架必须锁紧后方可加工。', [9]);

  // Tool post (刀架)
  box(root, 'tool-post', 0.18, 0.18, 0.18, STEEL, { x: 0.15, y: 1.33, z: 0 });
  meta('tool-post', '刀架', 'Tool Post', { x: 0.15, y: 1.33, z: 0 }, 'info',
    '夹持车刀的刀架，安装在大拖板/中拖板上。',
    '刀具必须锁紧，不得使用破损或松动的刀具。', [9]);

  // Coolant nozzle (冷却液喷嘴)
  cyl(root, 'coolant', 0.03, 0.03, 0.3, COOLANT, { x: 0.35, y: 1.5, z: -0.2, rx: 0.6 });
  meta('coolant', '冷却液喷嘴', 'Coolant Nozzle', { x: 0.35, y: 1.5, z: -0.2 }, 'info',
    '将冷却液喷向切削区域的喷嘴。',
    '操作前佩戴护目镜，防止切屑和冷却液飞溅。', [2]);

  // Feed handwheels (进给手轮)
  cyl(root, 'handwheel', 0.1, 0.1, 0.04, DARK, { x: 0.3, y: 0.7, z: 0.45, rx: Math.PI / 2 });
  box(root, 'handwheel', 0.05, 0.14, 0.03, STEEL, { x: 0.3, y: 0.7, z: 0.45 });
  meta('handwheel', '进给手轮', 'Feed Handwheel', { x: 0.3, y: 0.7, z: 0.45 }, 'info',
    '手动控制刀具进给的手轮。',
    '运转中不得离岗，调整前必须停机。', [15]);

  // Tailstock (尾座)
  box(root, 'tailstock', 0.5, 0.75, 0.6, STEEL, { x: 1.9, y: 0.9, z: 0 });
  meta('tailstock', '尾座', 'Tailstock', { x: 1.9, y: 0.9, z: 0 }, 'info',
    '位于床身右端、用于支撑长工件的尾座。',
    '长棒料伸出部分必须按教师要求使用支撑。', [7]);

  // Lead screw (丝杠)
  cylX(root, 'lead-screw', 0.04, 4.0, DARK, { x: 0, y: 0.45, z: 0.42 });
  meta('lead-screw', '丝杠', 'Lead Screw', { x: 0, y: 0.45, z: 0.42 }, 'danger',
    '带动大拖板移动的长丝杠，位于床身前侧。',
    '运转中的丝杠会卷入衣物，严禁靠近或触摸。', [3, 15]);

  // Control panel (控制面板)
  const panelG = group(root, 'control-panel', { x: -1.9, y: 1.75, z: 0.45 });
  box(panelG, 'control-panel', 0.85, 0.6, 0.08, PANEL, { x: 0, y: 0, z: 0 });
  meta('control-panel', '控制面板', 'Control Panel', { x: -1.9, y: 1.75, z: 0.45 }, 'info',
    '安装启动、急停和电源开关的操作面板。',
    '启动前确认防护罩和急停装置完好，先低速试运转。', [5, 11]);

  // Emergency stop (急停按钮)
  button(root, 'emergency-stop', 0.09, 0.12, RED, { x: -1.9, y: 1.82, z: 0.5 });
  meta('emergency-stop', '急停按钮', 'Emergency Stop', { x: -1.9, y: 1.82, z: 0.5 }, 'control',
    '红色蘑菇头急停按钮，遇危险立即按下。',
    '遇危险立即按下急停，随后关闭电源并报告教师。', [6]);

  // Power switch (电源开关)
  box(root, 'power-switch', 0.1, 0.16, 0.05, GREEN, { x: -1.9, y: 1.62, z: 0.5 });
  meta('power-switch', '电源开关', 'Power Switch', { x: -1.9, y: 1.62, z: 0.5 }, 'control',
    '控制设备电源通断的开关。',
    '离开或结束加工时必须停机并关闭电源。', [6, 15, 20]);

  return { root, parts };
}
