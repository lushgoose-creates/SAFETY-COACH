const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const rootDir = path.join(__dirname, '..');
const machines = JSON.parse(fs.readFileSync(path.join(rootDir, 'machines.json'), 'utf8'));
const byId = new Map();

for (const machine of machines) {
  if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(machine.id) || byId.has(machine.id)) {
    throw new Error(`Invalid or duplicate machine id: ${machine.id}`);
  }
  if (!machine.name || !machine.description) {
    throw new Error(`Machine ${machine.id} needs a name and description`);
  }
  const sopPath = path.join(rootDir, 'sops', `${machine.id}.md`);
  if (!fs.existsSync(sopPath)) {
    throw new Error(`Missing SOP file: ${sopPath}`);
  }
  byId.set(machine.id, { ...machine, sopPath });
}

function getMachine(id) {
  return byId.get(id) || null;
}

function listMachines() {
  return machines.map(({ id, name, nameEn, description, descriptionEn }) => ({
    id, name, nameEn, description, descriptionEn
  }));
}

function readSop(machine) {
  const text = fs.readFileSync(machine.sopPath, 'utf8').replace(/\r\n/g, '\n');
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  return { text, hash };
}

module.exports = { getMachine, listMachines, readSop };
