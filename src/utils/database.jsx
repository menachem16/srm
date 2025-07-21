// פונקציות CRUD בסיסיות על localStorage

window.trickleListObjects = function(key, limit = 100, reverse = false) {
  const data = JSON.parse(localStorage.getItem(key) || '{"items":[]}');
  let items = data.items || [];
  if (reverse) items = items.slice().reverse();
  return Promise.resolve({ items: items.slice(0, limit) });
};

window.trickleCreateObject = function(key, objectData) {
  const data = JSON.parse(localStorage.getItem(key) || '{"items":[]}');
  const objectId = Math.random().toString(36).substr(2, 9);
  const newObj = { objectId, objectData, createdAt: new Date().toISOString() };
  data.items.push(newObj);
  localStorage.setItem(key, JSON.stringify(data));
  return Promise.resolve(newObj);
};

window.trickleUpdateObject = function(key, objectId, newObjectData) {
  const data = JSON.parse(localStorage.getItem(key) || '{"items":[]}');
  const idx = data.items.findIndex(item => item.objectId === objectId);
  if (idx !== -1) {
    data.items[idx].objectData = newObjectData;
    localStorage.setItem(key, JSON.stringify(data));
    return Promise.resolve(data.items[idx]);
  }
  return Promise.reject(new Error('Object not found'));
};

window.trickleDeleteObject = function(key, objectId) {
  const data = JSON.parse(localStorage.getItem(key) || '{"items":[]}');
  data.items = data.items.filter(item => item.objectId !== objectId);
  localStorage.setItem(key, JSON.stringify(data));
  return Promise.resolve();
}; 