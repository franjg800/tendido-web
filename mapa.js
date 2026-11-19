// Mapa de plazas de Tendido en la web: MapLibre GL con los mapas libres de OpenFreeMap y el mismo estilo que en
// Android. El mapa va DEBAJO del lienzo de la app, que deja un hueco transparente encima; los gestos los recoge
// la app y los manda aquí, así la cabecera y la hoja de la app siguen funcionando por encima del mapa.
(function () {
  let tocado = false, abajoActual = 0, ultimo = null, cargando = null, mapa = null, caja = null, listo = false, pendiente = [], pinesActuales = null, colores = null;

  function cargarLibreria() {
    if (cargando) return cargando;
    cargando = new Promise((ok, mal) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'mapa/maplibre-gl.css'; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = 'mapa/maplibre-gl.js'; s.onload = ok; s.onerror = mal; document.head.appendChild(s);
    });
    return cargando;
  }

  // Pines dibujados una vez a la resolución de la pantalla: el ruedo de sol y sombra y el punto
  function ruedo(px, oro, fondo, borde, anchoBorde) {
    const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'); const r = px / 2;
    g.fillStyle = fondo; g.beginPath(); g.arc(r, r, r, 0, 7); g.fill();
    g.strokeStyle = borde; g.lineWidth = anchoBorde; g.beginPath(); g.arc(r, r, r - anchoBorde / 2 - 1, 0, 7); g.stroke();
    const i = r * 0.55; g.fillStyle = oro; g.beginPath(); g.moveTo(r, r); g.arc(r, r, i, -Math.PI / 4, Math.PI * 3 / 4); g.closePath(); g.fill();
    return g.getImageData(0, 0, px, px);
  }
  function punto(px, oro, fondo) {
    const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d');
    g.fillStyle = fondo; g.beginPath(); g.arc(px / 2, px / 2, px / 2, 0, 7); g.fill();
    g.fillStyle = oro; g.beginPath(); g.arc(px / 2, px / 2, px / 2 - px * 0.18, 0, 7); g.fill();
    return g.getImageData(0, 0, px, px);
  }

  function ponerImagenes() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), k = colores;
    const tam = Math.round(30 * dpr);
    const opc = { pixelRatio: dpr };
    [['ruedo', ruedo(tam, k.oro, k.fondo, k.oro, 2.2 * dpr)], ['elegida', ruedo(tam, k.oro, k.fondo, k.texto, 3.4 * dpr)], ['punto', punto(Math.round(11 * dpr), k.oro, k.fondo)]]
      .forEach(([n, img]) => { if (mapa.hasImage(n)) mapa.removeImage(n); mapa.addImage(n, img, opc); });
  }

  function ponerCapa() {
    const k = colores;
    if (!mapa.getSource('plazas')) mapa.addSource('plazas', { type: 'geojson', data: pinesActuales || { type: 'FeatureCollection', features: [] } });
    if (mapa.getLayer('pines')) return;
    mapa.addLayer({
      id: 'pines', type: 'symbol', source: 'plazas',
      layout: {
        'icon-image': ['get', 'img'], 'icon-size': ['get', 'tam'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'symbol-sort-key': ['get', 'orden'],
        // Nombre: siempre en las destacadas; el resto al acercarse
        'text-field': ['step', ['zoom'], ['case', ['get', 'dest'], ['get', 'nombre'], ''], 9.5, ['get', 'nombre']],
        'text-font': ['Noto Sans Bold'], 'text-size': 12.5, 'text-anchor': 'left', 'text-offset': [1.3, 0], 'text-optional': true,
      },
      paint: { 'text-color': k.texto, 'text-halo-color': k.fondo, 'text-halo-width': 1.6 },
    });
  }

  const ESPANA = [[-9.4, 35.9], [3.4, 43.9]], ARRIBA = 76;
  function encuadrar() {
    if (!mapa) return;
    const h = caja ? caja.clientHeight : 0;
    const abajo = Math.min(abajoActual, Math.max(0, h - ARRIBA - 140));
    mapa.fitBounds(ESPANA, { padding: { top: ARRIBA, left: 16, right: 16, bottom: 16 + abajo }, duration: 0 });
  }

  function cuandoListo(f) { if (listo) f(); else pendiente.push(f); }

  window.tendidoMapa = {
    abrir(estilo, oro, fondo, texto, abajo) {
      colores = { oro, fondo, texto };
      if (!caja) {
        caja = document.createElement('div');
        caja.id = 'mapa';
        caja.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;z-index:-1;background:${fondo};overflow:hidden`;
        document.getElementById('app').prepend(caja);
      }
      caja.style.display = 'block';
      cargarLibreria().then(() => {
        if (mapa) {
          if (estilo !== ultimo) this.estilo(estilo, oro, fondo, texto);
          mapa.resize();
          tocado = false; abajoActual = abajo; encuadrar();
          return;
        }
        ultimo = estilo; abajoActual = abajo;
        mapa = new maplibregl.Map({
          container: caja, style: JSON.parse(estilo), interactive: false, attributionControl: false,
          bounds: ESPANA, fitBoundsOptions: { padding: { top: ARRIBA, left: 16, right: 16, bottom: 16 + abajo } },
          minZoom: 4, maxZoom: 18, fadeDuration: 150, pixelRatio: Math.min(window.devicePixelRatio || 1, 3),
        });
        mapa.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenFreeMap © OpenStreetMap' }), 'top-right');
        mapa.on('load', () => { ponerImagenes(); ponerCapa(); listo = true; pendiente.splice(0).forEach(f => f()); });
      }).catch(e => console.error('No se pudo cargar el mapa', e));
    },
    estilo(estilo, oro, fondo, texto) {
      colores = { oro, fondo, texto };
      if (caja) caja.style.background = fondo;
      if (!mapa || estilo === ultimo) return;
      ultimo = estilo;
      listo = false;
      mapa.setStyle(JSON.parse(estilo));
      mapa.once('style.load', () => { ponerImagenes(); ponerCapa(); listo = true; pendiente.splice(0).forEach(f => f()); });
    },
    colocar(x, y, w, h) {
      if (!caja) return;
      const s = caja.style, cambia = s.width !== w + 'px' || s.height !== h + 'px';
      s.left = x + 'px'; s.top = y + 'px'; s.width = w + 'px'; s.height = h + 'px';
      if (cambia && mapa) mapa.resize();
    },
    pines(json) {
      pinesActuales = JSON.parse(json);
      cuandoListo(() => mapa.getSource('plazas').setData(pinesActuales));
    },
    // Mientras no se haya tocado el mapa, la península entera cabe entre la cabecera y la hoja de abajo
    margen(abajo) { abajoActual = abajo; if (!tocado) cuandoListo(encuadrar); },
    enfocar(lon, lat) { tocado = true; cuandoListo(() => mapa.flyTo({ center: [lon, lat], zoom: 15, duration: 1100, essential: true })); },
    // Gestos que manda la app: arrastrar y pellizcar a la vez, con el pellizco centrado entre los dedos
    gesto(dx, dy, escala, cx, cy) {
      if (!mapa) return;
      tocado = true;
      mapa.stop();
      if (escala !== 1) {
        const z = Math.max(mapa.getMinZoom(), Math.min(mapa.getMaxZoom(), mapa.getZoom() + Math.log2(escala)));
        mapa.easeTo({ zoom: z, around: mapa.unproject([cx, cy]), duration: 0 });
      }
      if (dx || dy) mapa.panBy([-dx, -dy], { duration: 0 });
    },
    inercia(vx, vy) {
      if (!mapa) return;
      const v = Math.hypot(vx, vy); if (v < 80) return;
      const lim = Math.min(1, 2400 / v);
      mapa.panBy([-vx * 0.28 * lim, -vy * 0.28 * lim], { duration: 750, easing: t => 1 - Math.pow(1 - t, 3) });
    },
    acercar(x, y, pasos) {
      if (!mapa) return;
      tocado = true;
      mapa.easeTo({ zoom: mapa.getZoom() + pasos, around: mapa.unproject([x, y]), duration: 300 });
    },
    // Toque: la plaza más cercana al dedo, si hay alguna a menos de 22 px
    tocar(x, y) {
      if (!mapa || !listo) return null;
      const r = 22;
      const l = mapa.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers: ['pines'] });
      let mejor = null, dmin = 1e9;
      l.forEach(f => { const p = mapa.project(f.geometry.coordinates); const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < dmin) { dmin = d; mejor = f.properties.id; } });
      return mejor;
    },
    cerrar() { if (caja) caja.style.display = 'none'; },
  };
})();
