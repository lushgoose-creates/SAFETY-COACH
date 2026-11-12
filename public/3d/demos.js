// Rule -> demo mapping. Data-driven, no three.js dependency so the rules list
// can use it without loading the viewer. Each demo tells the viewer which part
// to focus, what to highlight, and what to spin, plus a safety "mode".
window.SafetyCoachDemos = (function () {
  function demo(focus, highlight, spin, mode, ppe) {
    return { focus, highlight: highlight || [], spin: spin || [], mode: mode || 'info', ppe: ppe || null };
  }
  const spinX = (part, rpm) => ({ part, axis: 'x', rpm: rpm || 70 });
  const spinY = (part, rpm) => ({ part, axis: 'y', rpm: rpm || 70 });

  const DEMOS = {
    lathe: {
      1: demo('control-panel', [], [], 'info'),
      2: demo('coolant', ['coolant'], [], 'info', 'goggles'),
      3: demo('chuck', ['chuck', 'spindle'], [spinX('chuck', 90), spinX('spindle', 90)], 'wrong', 'gloves'),
      4: demo('spindle', ['spindle', 'chuck'], [spinX('spindle', 90), spinX('chuck', 90)], 'wrong', 'hair'),
      5: demo('chuck-guard', ['chuck-guard'], [], 'info'),
      6: demo('emergency-stop', ['emergency-stop', 'power-switch'], [], 'correct'),
      7: demo('workpiece', ['workpiece', 'chuck'], [], 'correct'),
      8: demo('chuck-key', ['chuck-key', 'chuck'], [], 'correct'),
      9: demo('tool-post', ['tool-post'], [], 'info'),
      10: demo('chuck-guard', ['chuck-guard'], [], 'correct'),
      11: demo('control-panel', ['control-panel'], [spinX('chuck', 40)], 'info'),
      12: demo('workpiece', ['workpiece', 'spindle'], [spinX('workpiece', 90), spinX('spindle', 90)], 'wrong'),
      13: demo('chuck', ['chuck'], [spinX('chuck', 90)], 'wrong'),
      14: demo('chip-tray', ['chip-tray'], [], 'correct'),
      15: demo('power-switch', ['power-switch', 'control-panel'], [], 'wrong'),
      16: demo('headstock', ['headstock'], [], 'wrong'),
      17: demo('power-switch', ['power-switch', 'spindle'], [], 'info'),
      18: demo('carriage', ['carriage'], [], 'info'),
      19: demo('bed', ['bed'], [], 'info'),
      20: demo('power-switch', ['power-switch', 'chip-tray'], [], 'correct'),
      21: demo('bed', ['bed', 'chip-tray'], [], 'info'),
      22: demo('control-panel', ['control-panel'], [], 'info')
    },
    'drill-press': {
      1: demo('head', [], [], 'info'),
      2: demo('drill-bit', ['drill-bit'], [], 'info', 'goggles'),
      3: demo('drill-bit', ['drill-bit', 'spindle'], [spinY('drill-bit', 90), spinY('spindle', 90)], 'wrong', 'gloves'),
      4: demo('drill-bit', ['drill-bit', 'spindle'], [spinY('spindle', 90)], 'wrong', 'hair'),
      5: demo('drill-bit', ['drill-bit'], [], 'info'),
      6: demo('vise', ['vise', 'table'], [], 'correct'),
      7: demo('emergency-stop', ['emergency-stop', 'power-switch'], [], 'correct'),
      8: demo('drill-chuck', ['drill-chuck'], [], 'correct'),
      9: demo('table', ['table'], [], 'info'),
      10: demo('guard', ['guard'], [], 'correct'),
      11: demo('drill-bit', ['drill-bit', 'spindle'], [spinY('drill-bit', 90), spinY('spindle', 90)], 'wrong'),
      12: demo('drill-bit', ['drill-bit'], [spinY('drill-bit', 90)], 'wrong'),
      13: demo('feed-handle', ['feed-handle'], [], 'info'),
      14: demo('drill-bit', ['drill-bit'], [spinY('drill-bit', 40)], 'info'),
      15: demo('table', ['table'], [], 'correct'),
      16: demo('head', ['head'], [], 'wrong'),
      17: demo('power-switch', ['power-switch'], [], 'wrong'),
      18: demo('power-switch', ['power-switch', 'spindle'], [], 'info'),
      19: demo('drill-bit', ['drill-bit'], [], 'info'),
      20: demo('power-switch', ['power-switch'], [], 'correct'),
      21: demo('base', ['base'], [], 'info'),
      22: demo('head', ['head'], [], 'info')
    }
  };

  const POWER_ON = {
    lathe: { highlight: ['power-switch'], spin: [spinX('spindle', 180), spinX('chuck', 180), spinX('workpiece', 180)] },
    'drill-press': { highlight: ['power-switch'], spin: [spinY('spindle', 240), spinY('drill-chuck', 240), spinY('drill-bit', 240)] }
  };

  return {
    hasDemo(machineId, ruleNumber) {
      return !!(DEMOS[machineId] && DEMOS[machineId][ruleNumber]);
    },
    getDemo(machineId, ruleNumber) {
      return DEMOS[machineId] ? DEMOS[machineId][ruleNumber] : null;
    },
    getPowerOn(machineId) {
      return POWER_ON[machineId] || null;
    }
  };
})();
