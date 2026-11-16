const cafes = window.CAFES;
const brands = [...new Set(cafes.flatMap(c => c.brands))].sort();
const selected = new Set();
let query = "";

const map = L.map("map").setView([49.1951, 16.6068], 14);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; přispěvatelé OpenStreetMap"
}).addTo(map);
const layer = L.layerGroup().addTo(map);
const markers = new Map();

const esc = s => String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));

function renderFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
  const all = document.createElement("button");
  all.className = "chip" + (selected.size ? "" : " on");
  all.textContent = "Všechny značky";
  all.onclick = () => { selected.clear(); update(); };
  box.append(all);
  brands.forEach(b => {
    const n = cafes.filter(c => c.brands.includes(b)).length;
    const el = document.createElement("button");
    el.className = "chip" + (selected.has(b) ? " on" : "");
    el.textContent = `${b} (${n})`;
    el.onclick = () => { selected.has(b) ? selected.delete(b) : selected.add(b); update(); };
    box.append(el);
  });
}

function popup(c) {
  const nav = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
  return `<b>${esc(c.name)}</b><br>${esc(c.type)} · ${esc(c.address)}<br>` +
    `Káva: ${c.brands.map(esc).join(", ")}<br>${esc(c.hours)}<br>` +
    `<a href="${nav}" target="_blank" rel="noopener">Navigovat</a>` +
    (c.web ? ` · <a href="${esc(c.web)}" target="_blank" rel="noopener">Web</a>` : "");
}

function update() {
  const q = query.trim().toLowerCase();
  // vybráno více značek = podnik musí mít alespoň jednu z nich
  const shown = cafes.filter(c =>
    (!selected.size || c.brands.some(b => selected.has(b))) &&
    (!q || (c.name + " " + c.address).toLowerCase().includes(q)));

  renderFilters();
  layer.clearLayers();
  markers.clear();
  const list = document.getElementById("list");
  list.innerHTML = "";
  document.getElementById("count").textContent = `Nalezeno: ${shown.length}`;

  shown.forEach(c => {
    const m = L.marker([c.lat, c.lng]).bindPopup(popup(c)).addTo(layer);
    markers.set(c.id, m);
    const li = document.createElement("li");
    li.innerHTML = `<h3>${esc(c.name)}</h3><div class="meta">${esc(c.type)} · ${esc(c.address)}</div>` +
      c.brands.map(b => `<span class="tag">${esc(b)}</span>`).join("") +
      (c.verified ? "" : `<div class="unv">neověřená data</div>`);
    li.onclick = () => { map.setView([c.lat, c.lng], 16); m.openPopup(); };
    list.append(li);
  });
  if (shown.length) map.fitBounds(L.latLngBounds(shown.map(c => [c.lat, c.lng])).pad(0.2), { maxZoom: 16 });
}

document.getElementById("search").addEventListener("input", e => { query = e.target.value; update(); });
update();
