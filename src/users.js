const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'manager', password: 'mgr123', role: 'manager' },
  { id: 3, username: 'staff', password: 'staff123', role: 'staff' },
];

module.exports = {
  findByUsername: (u) => users.find(x => x.username === u),
  findById: (id) => users.find(x => x.id === id),
  validate: (user, pw) => user && user.password === pw,
  list: () => users.map(u => ({ id: u.id, username: u.username, role: u.role })),
};
