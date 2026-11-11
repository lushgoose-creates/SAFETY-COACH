function language(value) {
  return value === 'en' ? 'en' : 'zh';
}

function machineView(machine, lang) {
  if (lang === 'en') {
    return {
      ...machine,
      name: machine.nameEn || machine.name,
      description: machine.descriptionEn || machine.description
    };
  }
  return { ...machine, name: machine.name, description: machine.description };
}

module.exports = { language, machineView };
