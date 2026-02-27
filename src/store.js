const data = {};
const counters = {};

function store(name) {
  if (!data[name]) { data[name] = []; counters[name] = 0; }
  return {
    getAll: () => data[name].slice(),
    getById: (id) => data[name].find(i => i.id === parseInt(id)),
    create: (item) => { const i = { id: ++counters[name], ...item }; data[name].push(i); return i; },
    update: (id, updates) => { const i = data[name].find(x => x.id === parseInt(id)); if (!i) return null; Object.assign(i, updates); return i; },
    remove: (id) => { const idx = data[name].findIndex(x => x.id === parseInt(id)); if (idx === -1) return false; data[name].splice(idx, 1); return true; },
    reset: () => { data[name] = []; counters[name] = 0; },
  };
}

function resetAll() { Object.keys(data).forEach(k => { data[k] = []; counters[k] = 0; }); }

module.exports = { store, resetAll };
