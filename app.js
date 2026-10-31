/* La Tirada — mapa de canchas de petanca de Madrid */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const sheet = $('#sheet');
  const listEl = $('#list');
  const panelList = $('#panel-list');
  const panelDetail = $('#panel-detail');
  const detailEl = $('#detail');
  const distSel = $('#distrito');
  const q = $('#q');
  const isDesktop = () => matchMedia('(min-width: 820px)').matches;

  const state = { features: [], cat: 'todas', distrito: '', text: '', me: null, selected: null };
  const markers = new Map();

  // ---------- Mapa ----------
  const MADRID = [40.4168, -3.7038];
  const map = L.map('map', { zoomControl: false, attributionControl: true, tap: true }).setView(MADRID, 12);
  map.attributionControl.setPrefix(false);

  // Mapa base de OpenStreetMap; el tono se ajusta a la identidad con CSS (.leaflet-tile-pane)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  const pinIcon = (p, sel) => L.divIcon({
    className: '',
    html: `<div class="pin ${p.categoria === 'otra' ? 'otra' : ''} ${sel ? 'sel' : ''}">${p.pistas || ''}</div>`,
    iconSize: p.categoria === 'otra' ? [28, 28] : [34, 34],
    iconAnchor: p.categoria === 'otra' ? [14, 14] : [17, 17]
  });

  // ---------- Utilidades ----------
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const km = (a, b) => {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const fmtKm = (d) => d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(1).replace('.', ',')} km`;
  const latlng = (f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]];

  // ---------- Hoja inferior ----------
  const setSheet = (s) => { if (!isDesktop()) sheet.dataset.state = s; };
  const order = ['peek', 'half', 'full'];
  (() => {
    const grip = $('#grip');
    let y0 = null, moved = false;
    grip.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointermove', (e) => { if (y0 !== null && Math.abs(e.clientY - y0) > 12) moved = true; });
    grip.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0; y0 = null;
      const i = order.indexOf(sheet.dataset.state);
      if (!moved) setSheet(sheet.dataset.state === 'peek' ? 'full' : 'peek');
      else if (dy < 0) setSheet(order[Math.min(i + 1 + (dy < -180 ? 1 : 0), 2)]);
      else setSheet(order[Math.max(i - 1 - (dy > 180 ? 1 : 0), 0)]);
    });
    // Al tocar el buscador, subir la hoja
    q.addEventListener('focus', () => setSheet('full'));
  })();

  // ---------- Filtros ----------
  const visible = () => state.features.filter((f) => {
    const p = f.properties;
    if (state.cat !== 'todas' && p.categoria !== state.cat) return false;
    if (state.distrito && p.distrito !== state.distrito) return false;
    if (state.text) {
      const hay = norm(`${p.nombre} ${p.direccion} ${p.barrio} ${p.distrito}`);
      if (!state.text.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });

  document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === b)));
    state.cat = b.dataset.cat; render(true);
  }));
  distSel.addEventListener('change', () => { state.distrito = distSel.value; render(true); });
  q.addEventListener('input', () => { state.text = norm(q.value.trim()); render(false); });

  // ---------- Pintar ----------
  function render(fit) {
    const vis = visible();
    const ids = new Set(vis.map((f) => f.properties.id));
    markers.forEach((m, id) => { ids.has(id) ? m.addTo(map) : m.remove(); });

    $('#count-canchas').textContent = vis.length;
    $('#count-pistas').textContent = vis.reduce((s, f) => s + (f.properties.pistas || 0), 0);

    let rows = vis.map((f) => ({ f, d: state.me ? km(state.me, latlng(f)) : null }));
    if (state.me) rows.sort((a, b) => a.d - b.d);

    listEl.innerHTML = rows.length ? rows.map(({ f, d }) => {
      const p = f.properties;
      return `<li class="item ${p.categoria}" data-id="${esc(p.id)}" tabindex="0">
        <span class="n" aria-label="${p.pistas} pistas">${p.pistas}</span>
        <div class="t"><h3>${esc(p.nombre)}</h3><p>${esc(p.distrito)} · ${esc(p.direccion)}</p></div>
        <span class="d">${d !== null ? fmtKm(d) : ''}</span>
      </li>`;
    }).join('') : '<li class="empty">No hay canchas con estos filtros.</li>';

    if (fit && vis.length) fitTo(vis.map(latlng));
  }

  function fitTo(points) {
    const b = L.latLngBounds(points);
    const pad = isDesktop() ? { paddingTopLeft: [420, 90], paddingBottomRight: [40, 40] }
      : { paddingTopLeft: [30, 90], paddingBottomRight: [30, 200] };
    map.fitBounds(b, { ...pad, maxZoom: 15 });
  }

  listEl.addEventListener('click', (e) => { const li = e.target.closest('.item'); if (li) select(li.dataset.id, true); });
  listEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const li = e.target.closest('.item'); if (li) select(li.dataset.id, true); } });

  // ---------- Ficha ----------
  const yes = (v) => v === true ? 'Sí' : v === false ? 'No' : null;
  function select(id, fly) {
    const f = state.features.find((x) => x.properties.id === id);
    if (!f) return;
    if (state.selected) markers.get(state.selected)?.setIcon(pinIcon(state.features.find((x) => x.properties.id === state.selected).properties, false));
    state.selected = id;
    markers.get(id).setIcon(pinIcon(f.properties, true)).setZIndexOffset(1000);

    const p = f.properties;
    const [lat, lng] = latlng(f);
    const dist = state.me ? ` · a ${fmtKm(km(state.me, [lat, lng]))}` : '';
    const pending = [['Iluminación', p.iluminacion], ['Sombra', p.sombra], ['Bancos', p.bancos], ['Fuente de agua', p.agua], ['Tipo de suelo', p.superficie], ['Se juega a menudo', p.juego_habitual]];
    const known = pending.filter(([, v]) => v !== null && v !== undefined);
    const unknown = pending.filter(([, v]) => v === null || v === undefined);

    detailEl.innerHTML = `
      <div class="d-head">
        <div class="big"><b>${p.pistas}</b><small>${p.pistas === 1 ? 'pista' : 'pistas'}</small></div>
        <div>
          <h2>${esc(p.nombre)}</h2>
          <p class="where">${esc(p.distrito)}${p.barrio ? ' · ' + esc(p.barrio) : ''}${dist}</p>
          <span class="tag">${p.categoria === 'otra' ? 'Club' : 'Parque público'} · acceso ${esc(p.acceso)}</span>
        </div>
      </div>
      <div class="actions">
        <a class="btn primary" href="https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(p.nombre)}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener">Google Maps</a>
      </div>
      <dl class="facts">
        <div><dt>Dirección</dt><dd>${esc(p.direccion)}${p.cp ? ', ' + esc(p.cp) : ''}</dd></div>
        ${p.metro ? `<div><dt>Metro</dt><dd>${esc(p.metro)}</dd></div>` : ''}
        <div><dt>Instalación</dt><dd>${esc(p.equipamiento)}</dd></div>
        ${known.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(yes(v) ?? v)}</dd></div>`).join('')}
        ${unknown.length ? `<div><dt>Por verificar</dt><dd><div class="checks">${unknown.map(([k]) => `<span>${k}</span>`).join('')}</div></dd></div>` : ''}
      </dl>
      <p class="src">Fuente: ${esc(p.fuente)}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">ficha municipal</a>` : ''}</p>`;

    panelList.hidden = true; panelDetail.hidden = false; panelDetail.scrollTop = 0;
    setSheet('half');
    focusOn([lat, lng], fly ? Math.max(map.getZoom(), 15) : map.getZoom());
    history.replaceState(null, '', '#c' + id);
  }

  // Centra el punto en la parte visible del mapa (por encima de la hoja o a la derecha del panel)
  function focusOn(ll, z) {
    const off = isDesktop() ? [-205, 0] : [0, Math.round(window.innerHeight * 0.22)];
    const pt = map.project(ll, z).add(off);
    map.flyTo(map.unproject(pt, z), z, { duration: .6 });
  }

  function closeDetail() {
    if (state.selected) {
      const f = state.features.find((x) => x.properties.id === state.selected);
      markers.get(state.selected)?.setIcon(pinIcon(f.properties, false)).setZIndexOffset(0);
    }
    state.selected = null;
    panelDetail.hidden = true; panelList.hidden = false;
    setSheet('peek');
    history.replaceState(null, '', location.pathname + location.search);
  }
  $('#back').addEventListener('click', closeDetail);
  map.on('click', () => { if (state.selected) closeDetail(); else setSheet('peek'); });

  // ---------- Ubicación ----------
  let meMarker = null;
  $('#locate').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      state.me = [pos.coords.latitude, pos.coords.longitude];
      const icon = L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
      meMarker ? meMarker.setLatLng(state.me) : (meMarker = L.marker(state.me, { icon, interactive: false }).addTo(map));
      map.flyTo(state.me, 14, { duration: .6 });
      $('#hint').textContent = 'Ordenadas por distancia a ti';
      render(false);
    }, () => { $('#hint').textContent = 'No se pudo obtener tu ubicación. Revisa los permisos de Safari.'; }, { enableHighAccuracy: true, timeout: 10000 });
  });

  // ---------- Datos ----------
  fetch('data/canchas.geojson')
    .then((r) => r.json())
    .then((gj) => {
      state.features = gj.features;
      [...new Set(gj.features.map((f) => f.properties.distrito))].sort((a, b) => a.localeCompare(b, 'es'))
        .forEach((d) => distSel.insertAdjacentHTML('beforeend', `<option>${esc(d)}</option>`));
      gj.features.forEach((f) => {
        const m = L.marker(latlng(f), { icon: pinIcon(f.properties, false), title: f.properties.nombre, keyboard: true });
        m.on('click', (e) => { L.DomEvent.stopPropagation(e); select(f.properties.id, false); });
        markers.set(f.properties.id, m);
      });
      render(true);
      const h = location.hash.match(/^#c(\d+)$/);
      if (h) select(h[1], true);
    })
    .catch(() => { listEl.innerHTML = '<li class="empty">No se pudieron cargar las canchas. Recarga la página.</li>'; });

  // PWA: registrar el service worker si existe (solo en GitHub Pages / https)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
