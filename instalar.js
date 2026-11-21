// Instalar Tendido en la pantalla de inicio: detecta si ya está instalada, guarda el aviso de instalación de
// Chrome y enseña un tutorial con los pasos exactos del navegador que se está usando.
(function () {
  const RES = 'composeResources/app.toros.res/font/';
  const ua = navigator.userAgent;
  const esIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const esAndroid = /Android/.test(ua);
  const esSamsung = /SamsungBrowser/.test(ua);
  const dentroDe = (/Instagram/.test(ua) && 'Instagram') || (/FBAN|FBAV|FB_IAB/.test(ua) && 'Facebook') || (/musical_ly|TikTok|BytedanceWebview/.test(ua) && 'TikTok') || (/Twitter/.test(ua) && 'X') || (/Line\//.test(ua) && 'LINE') || null;
  const otroNavegadorIOS = esIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const versionSafari = (() => { const m = ua.match(/Version\/(\d+)/); return m ? +m[1] : 0; })();

  const guardado = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const comoApp = () => window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  let instalada = comoApp() || guardado('tendido-instalada') === '1';
  let aviso = null;           // el aviso de instalación de Chrome/Edge, si el navegador lo ofrece
  let alCambiar = null;

  const avisar = () => { if (alCambiar) alCambiar(!instalada); };
  const marcarInstalada = () => { instalada = true; guardar('tendido-instalada', '1'); avisar(); cerrar(); };

  if (comoApp()) guardar('tendido-instalada', '1');
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); aviso = e;
    // Si Chrome vuelve a ofrecer instalarla, es que ya no está instalada (la quitaron)
    if (instalada && !comoApp()) { instalada = false; guardar('tendido-instalada', '0'); avisar(); }
    const b = document.getElementById('ins-directo'); if (b) b.hidden = false;
  });
  addEventListener('appinstalled', marcarInstalada);
  // Android: Chrome sabe si esta web ya está instalada (manifest con related_applications)
  if (!instalada && navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(l => { if (l && l.length) marcarInstalada(); }).catch(() => {});

  // ------------------------------------------------------------------ Estilos
  const css = `
  @font-face { font-family: 'Bodoni Tendido'; src: url('${RES}bodoni_bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
  @font-face { font-family: 'Schibsted Tendido'; src: url('${RES}schibsted_regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'Schibsted Tendido'; src: url('${RES}schibsted_semibold.ttf') format('truetype'); font-weight: 600; font-display: swap; }
  #ins { --fondo: #12100E; --sup: #1C1916; --alta: #29241F; --texto: #F4EEE3; --medio: #B9AF9F; --suave: #857B6E; --oro: #D8B160; --grana: #C42B30; --linea: rgba(244,238,227,.10);
    position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; font-family: 'Schibsted Tendido', -apple-system, system-ui, sans-serif; color: var(--texto); }
  #ins[hidden] { display: none; }
  #ins .velo { position: absolute; inset: 0; background: rgba(8,7,6,.62); opacity: 0; transition: opacity .3s; }
  #ins .hoja { position: relative; width: 100%; max-width: 520px; max-height: calc(100% - 28px - env(safe-area-inset-top, 0px)); overflow-y: auto; -webkit-overflow-scrolling: touch;
    background: var(--fondo); border-radius: 28px 28px 0 0; border-top: 1px solid var(--linea);
    padding: 10px max(20px, env(safe-area-inset-left, 0px)) calc(20px + env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-right, 0px));
    transform: translateY(100%); transition: transform .42s cubic-bezier(.2,.9,.25,1); box-sizing: border-box; }
  #ins.abierto .velo { opacity: 1; } #ins.abierto .hoja { transform: none; }
  #ins .asa { width: 38px; height: 4px; border-radius: 2px; background: var(--alta); margin: 0 auto 18px; }
  #ins .cab { display: flex; gap: 14px; align-items: center; }
  #ins .cab img { width: 58px; height: 58px; border-radius: 14px; flex: none; box-shadow: 0 0 0 1px var(--linea); }
  #ins h2 { margin: 0; font: 700 31px/1.02 'Bodoni Tendido', Georgia, serif; letter-spacing: -.005em; }
  #ins .sub { margin: 14px 0 0; color: var(--medio); font-size: 15px; line-height: 1.45; }
  #ins ol { list-style: none; margin: 22px 0 0; padding: 0; display: grid; gap: 12px; counter-reset: paso; }
  #ins li { counter-increment: paso; display: grid; grid-template-columns: 34px 1fr; gap: 4px 14px; background: var(--sup); border-radius: 20px; padding: 16px; }
  #ins li::before { content: counter(paso); grid-row: span 2; width: 34px; height: 34px; border-radius: 50%; background: var(--oro); color: var(--fondo); display: grid; place-items: center; font: 700 19px/1 'Bodoni Tendido', Georgia, serif; }
  #ins li p { margin: 5px 0 0; font-size: 15.5px; line-height: 1.42; }
  #ins li b { font-weight: 600; color: var(--texto); background: var(--alta); border-radius: 7px; padding: 1px 7px; white-space: nowrap; }
  #ins li small { display: block; color: var(--suave); font-size: 13px; line-height: 1.4; margin-top: 4px; }
  #ins .dibujo { grid-column: 2; margin-top: 10px; }
  #ins .dibujo svg { display: block; width: 100%; height: auto; max-width: 300px; }
  #ins .botones { display: grid; gap: 10px; margin-top: 20px; }
  #ins button { appearance: none; border: 0; font: 600 16px/1 'Schibsted Tendido', -apple-system, system-ui, sans-serif; height: 54px; border-radius: 27px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
  #ins button[hidden] { display: none; }
  #ins .principal { background: var(--grana); color: #FFF7EE; }
  #ins .secundario { background: transparent; color: var(--texto); box-shadow: inset 0 0 0 1.5px var(--alta); }
  #ins button:focus-visible { outline: 2px solid var(--oro); outline-offset: 3px; }
  #ins .nota { margin: 14px 4px 0; color: var(--suave); font-size: 13px; line-height: 1.45; text-align: center; }
  #ins .enlace { display: flex; gap: 8px; align-items: center; margin-top: 12px; background: var(--sup); border-radius: 16px; padding: 6px 6px 6px 14px; }
  #ins .enlace span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--medio); font-size: 14px; user-select: all; -webkit-user-select: all; }
  #ins .enlace button { height: 40px; padding: 0 16px; border-radius: 20px; font-size: 14px; background: var(--alta); color: var(--texto); }
  /* Flecha que apunta a la barra de Safari de abajo, donde está el botón que hay que tocar */
  #ins-flecha { position: fixed; z-index: 51; bottom: calc(6px + env(safe-area-inset-bottom, 0px)); width: 46px; height: 46px; pointer-events: none; display: none; animation: insBota 1.1s ease-in-out infinite; }
  #ins-flecha.ver { display: block; }
  /* Hueco al final de la hoja para que la flecha no tape los botones */
  #ins .hoja.con-flecha { margin-bottom: calc(62px + env(safe-area-inset-bottom, 0px)); border-radius: 28px; padding-bottom: 20px; max-height: calc(100% - 90px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
  @keyframes insBota { 0%,100% { transform: translateY(-6px); } 50% { transform: translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { #ins .hoja, #ins .velo { transition: none; } #ins-flecha { animation: none; } }
  `;

  // ------------------------------------------------------------------ Dibujos de cada paso (como se ve en el móvil)
  const HOST = (location.host || 'tendido').replace(/^www\./, '').slice(0, 24);
  const C = { barra: '#2B2B2E', texto: '#F2F2F7', gris: '#8E8E93', azul: '#0A84FF', marca: '#D8B160' };
  const aro = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.marca}" stroke-width="2.5"><animate attributeName="r" values="${r};${r + 4};${r}" dur="1.4s" repeatCount="indefinite"/></circle>`;
  const iconoCompartir = (x, y, color) => `<g transform="translate(${x - 9} ${y - 11})" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 1v13M4.5 5.5 9 1l4.5 4.5"/><path d="M5 9H2.5v11h13V9H13"/></g>`;
  const dibujos = {
    // Safari de iOS 26: barra flotante abajo con «···» a la derecha
    tresPuntosIOS: `<svg viewBox="0 0 300 72"><rect x="4" y="12" width="292" height="48" rx="24" fill="${C.barra}"/>
      <g fill="none" stroke="${C.texto}" stroke-width="2" stroke-linecap="round"><path d="M30 28l-8 8 8 8"/></g>
      <rect x="54" y="20" width="182" height="32" rx="16" fill="#3A3A3D"/><text x="145" y="41" fill="${C.texto}" font-size="14" font-family="-apple-system,system-ui,sans-serif" text-anchor="middle">${HOST}</text>
      <g fill="${C.texto}"><circle cx="257" cy="36" r="2.4"/><circle cx="266" cy="36" r="2.4"/><circle cx="275" cy="36" r="2.4"/></g>${aro(266, 36, 19)}</svg>`,
    menuCompartirIOS: `<svg viewBox="0 0 300 118"><rect x="70" y="4" width="226" height="110" rx="22" fill="${C.barra}"/>
      <g font-family="-apple-system,system-ui,sans-serif" font-size="15" fill="${C.texto}">
      <text x="92" y="36" fill="${C.gris}">Copiar</text><line x1="88" y1="51" x2="280" y2="51" stroke="#3A3A3D"/>
      <text x="92" y="77">Compartir</text>${iconoCompartir(268, 72, C.texto)}<line x1="88" y1="94" x2="280" y2="94" stroke="#3A3A3D"/>
      <text x="92" y="111" fill="${C.gris}" font-size="13">…</text></g>
      <rect x="80" y="54" width="208" height="38" rx="12" fill="none" stroke="${C.marca}" stroke-width="2.5"/></svg>`,
    hojaIOS: `<svg viewBox="0 0 300 112"><rect x="4" y="4" width="292" height="104" rx="20" fill="${C.barra}"/>
      <g font-family="-apple-system,system-ui,sans-serif" font-size="15" fill="${C.texto}">
      <text x="22" y="34" fill="${C.gris}">Añadir a favoritos</text><line x1="18" y1="49" x2="282" y2="49" stroke="#3A3A3D"/>
      <text x="22" y="77">Añadir a pantalla de inicio</text>
      <g transform="translate(262 62)" fill="none" stroke="${C.texto}" stroke-width="1.8"><rect x="0" y="0" width="17" height="17" rx="4.5"/><path d="M8.5 4.5v8M4.5 8.5h8" stroke-linecap="round"/></g>
      <line x1="18" y1="92" x2="282" y2="92" stroke="#3A3A3D"/></g>
      <rect x="12" y="54" width="276" height="36" rx="11" fill="none" stroke="${C.marca}" stroke-width="2.5"/></svg>`,
    anadirIOS: `<svg viewBox="0 0 300 116"><rect x="4" y="4" width="292" height="108" rx="20" fill="${C.barra}"/>
      <g font-family="-apple-system,system-ui,sans-serif" font-size="15" fill="${C.texto}">
      <text x="22" y="34" fill="${C.azul}">Cancelar</text><text x="278" y="34" fill="${C.azul}" font-weight="600" text-anchor="end">Añadir</text>
      <line x1="18" y1="50" x2="282" y2="50" stroke="#3A3A3D"/><text x="22" y="86">Abrir como app web</text>
      <rect x="230" y="70" width="50" height="30" rx="15" fill="#30D158"/><circle cx="265" cy="85" r="13" fill="#fff"/></g>
      ${aro(253, 29, 26)}</svg>`,
    // Safari de iOS 18: botón Compartir en la barra de abajo
    compartirIOS18: `<svg viewBox="0 0 300 64"><rect x="4" y="6" width="292" height="52" rx="14" fill="${C.barra}"/>
      <g fill="none" stroke="${C.azul}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M34 24l-8 8 8 8"/><path d="M80 24l8 8-8 8"/>
      <path d="M200 26a11 7 0 0 1 22 0v12h-22z"/><rect x="250" y="22" width="16" height="18" rx="3"/><rect x="255" y="26" width="16" height="18" rx="3"/></g>
      ${iconoCompartir(150, 33, C.azul)}${aro(150, 32, 20)}</svg>`,
    // Chrome de Android: «⋮» arriba a la derecha
    tresPuntosAndroid: `<svg viewBox="0 0 300 64"><rect x="4" y="8" width="292" height="48" rx="24" fill="${C.barra}"/>
      <rect x="18" y="18" width="200" height="28" rx="14" fill="#3A3A3D"/><text x="34" y="37" fill="${C.texto}" font-size="14" font-family="Roboto,system-ui,sans-serif">${HOST}</text>
      <rect x="230" y="22" width="20" height="20" rx="5" fill="none" stroke="${C.texto}" stroke-width="1.8"/><text x="240" y="37" fill="${C.texto}" font-size="11" text-anchor="middle" font-family="Roboto,system-ui,sans-serif">1</text>
      <g fill="${C.texto}"><circle cx="273" cy="24" r="2.4"/><circle cx="273" cy="32" r="2.4"/><circle cx="273" cy="40" r="2.4"/></g>${aro(273, 32, 18)}</svg>`,
    menuAndroid: `<svg viewBox="0 0 300 112"><rect x="60" y="4" width="236" height="104" rx="18" fill="${C.barra}"/>
      <g font-family="Roboto,system-ui,sans-serif" font-size="15" fill="${C.texto}"><text x="80" y="34" fill="${C.gris}">Compartir…</text>
      <text x="80" y="66">Añadir a pantalla de inicio</text><text x="80" y="96" fill="${C.gris}">Versión para ordenador</text></g>
      <rect x="68" y="44" width="220" height="34" rx="10" fill="none" stroke="${C.marca}" stroke-width="2.5"/></svg>`,
  };

  // ------------------------------------------------------------------ Pasos según el navegador
  function pasos() {
    const p = (texto, nota, dibujo) => `<li><p>${texto}</p>${nota ? `<small>${nota}</small>` : '<span></span>'}${dibujo ? `<div class="dibujo">${dibujos[dibujo]}</div>` : ''}</li>`;
    if (dentroDe) return {
      sub: `Estás viendo Tendido dentro de ${dentroDe}, y desde aquí no se puede instalar. Ábrela en ${esIOS ? 'Safari' : 'Chrome'} y sigue los pasos que te saldrán allí.`,
      lista: p(`Toca los tres puntos <b>···</b> de arriba a la derecha.`) +
             p(`Elige <b>${esIOS ? 'Abrir en el navegador' : 'Abrir en Chrome'}</b>.`, `Si no aparece, copia el enlace de abajo y pégalo en ${esIOS ? 'Safari' : 'Chrome'}.`),
      enlace: true, flecha: false,
    };
    if (esIOS && otroNavegadorIOS) return {
      sub: 'Así tendrás su icono en la pantalla de inicio y se abrirá a pantalla completa, como cualquier app.',
      lista: p(`Toca el botón Compartir <b>⬆︎</b> en la barra de direcciones, arriba a la derecha.`) +
             p(`Baja y toca <b>Añadir a pantalla de inicio</b>.`, 'Si no aparece, abre esta página en Safari.', 'hojaIOS') +
             p(`Toca <b>Añadir</b>.`),
      enlace: true, flecha: false,
    };
    if (esIOS && versionSafari >= 26) return {
      sub: 'Así tendrás su icono en la pantalla de inicio y se abrirá a pantalla completa, como cualquier app. Son cuatro toques.',
      lista: p(`Toca el botón <b>···</b> de la barra de Safari, abajo a la derecha.`, null, 'tresPuntosIOS') +
             p(`Toca <b>Compartir</b>.`, null, 'menuCompartirIOS') +
             p(`Baja por la lista y toca <b>Añadir a pantalla de inicio</b>.`, 'Si no la ves, toca «Ver más» al final de la lista.', 'hojaIOS') +
             p(`Deja activado <b>Abrir como app web</b> y toca <b>Añadir</b>.`, null, 'anadirIOS'),
      flecha: 'derecha',
    };
    if (esIOS) return {
      sub: 'Así tendrás su icono en la pantalla de inicio y se abrirá a pantalla completa, como cualquier app. Son tres toques.',
      lista: p(`Toca el botón Compartir, el cuadrado con la flecha hacia arriba, en la barra de abajo.`, 'Si no ves la barra, desliza la página un poco hacia abajo.', 'compartirIOS18') +
             p(`Baja por la lista y toca <b>Añadir a pantalla de inicio</b>.`, null, 'hojaIOS') +
             p(`Toca <b>Añadir</b>, arriba a la derecha.`),
      flecha: 'centro',
    };
    if (esSamsung) return {
      sub: 'Así tendrás su icono en la pantalla de inicio y se abrirá a pantalla completa, como cualquier app.',
      lista: p(`Toca el menú <b>☰</b> de la barra de abajo.`) +
             p(`Toca <b>Añadir página a</b> y luego <b>Pantalla de inicio</b>.`) +
             p(`Confirma con <b>Añadir</b>.`),
      flecha: false,
    };
    if (esAndroid) return {
      sub: 'Así tendrás su icono en la pantalla de inicio y se abrirá a pantalla completa, como cualquier app.',
      lista: p(`Toca los tres puntos <b>⋮</b> de Chrome, arriba a la derecha.`, null, 'tresPuntosAndroid') +
             p(`Toca <b>Añadir a pantalla de inicio</b>.`, 'En algunos móviles pone «Instalar aplicación».', 'menuAndroid') +
             p(`Toca <b>Instalar</b>.`, 'Si te pregunta, elige «Instalar» y no «Crear acceso directo».'),
      flecha: false,
    };
    return {
      sub: 'Tendido está pensada para el móvil: abre esta página en tu teléfono y te enseñará cómo ponerla en la pantalla de inicio. En el ordenador también puedes instalarla:',
      lista: p(`En Chrome o Edge, toca el icono de instalar de la barra de direcciones, a la derecha.`) +
             p(`En Safari del Mac, ve a <b>Archivo</b> y elige <b>Añadir al Dock</b>.`),
      enlace: true, flecha: false,
    };
  }

  // ------------------------------------------------------------------ La hoja
  let raiz = null, flecha = null;
  function montar() {
    if (raiz) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    raiz = document.createElement('div'); raiz.id = 'ins'; raiz.hidden = true;
    raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-modal', 'true'); raiz.setAttribute('aria-labelledby', 'ins-titulo');
    document.body.appendChild(raiz);
    flecha = document.createElement('div'); flecha.id = 'ins-flecha';
    flecha.innerHTML = `<svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="22" fill="#C42B30"/><path d="M23 12v20M15 25l8 8 8-8" fill="none" stroke="#FFF7EE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    document.body.appendChild(flecha);
    raiz.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  }

  function abrir() {
    montar();
    guardar('tendido-tutorial', '1');
    const x = pasos();
    const url = location.origin + location.pathname;
    raiz.innerHTML = `<div class="velo"></div><div class="hoja">
      <div class="asa"></div>
      <div class="cab"><img src="icono-180.png" alt=""><h2 id="ins-titulo">Instala Tendido en tu móvil</h2></div>
      <p class="sub">${x.sub}</p>
      <div class="botones" style="margin-top:18px"><button class="principal" id="ins-directo" ${aviso ? '' : 'hidden'}>Instalar Tendido</button></div>
      ${aviso ? '<p class="nota" style="margin-top:10px">O hazlo a mano desde el menú del navegador:</p>' : ''}
      <ol>${x.lista}</ol>
      ${x.enlace ? `<div class="enlace"><span>${url}</span><button id="ins-copiar">Copiar enlace</button></div>` : ''}
      <div class="botones"><button class="secundario" id="ins-cerrar">Ahora no</button></div>
      <p class="nota">Cuando la abras desde el icono, este aviso no volverá a salir.</p>
    </div>`;
    raiz.querySelector('.velo').onclick = cerrar;
    raiz.querySelector('#ins-cerrar').onclick = cerrar;
    raiz.querySelector('#ins-directo').onclick = async () => {
      if (!aviso) return;
      aviso.prompt();
      const r = await aviso.userChoice.catch(() => null);
      aviso = null;
      if (r && r.outcome === 'accepted') marcarInstalada();
    };
    const copiar = raiz.querySelector('#ins-copiar');
    if (copiar) copiar.onclick = () => {
      const listo = () => { copiar.textContent = 'Copiado'; setTimeout(() => copiar.textContent = 'Copiar enlace', 1800); };
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(listo).catch(() => {
        const r = document.createRange(); r.selectNodeContents(raiz.querySelector('.enlace span'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    };
    raiz.hidden = false;
    flecha.className = '';
    raiz.querySelector('.hoja').classList.toggle('con-flecha', !!x.flecha);
    if (x.flecha) { flecha.style.right = x.flecha === 'derecha' ? 'calc(22px + env(safe-area-inset-right, 0px))' : 'calc(50% - 23px)'; flecha.className = 'ver'; }
    requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.add('abierto')));
  }

  function cerrar() {
    if (!raiz || raiz.hidden) return;
    raiz.classList.remove('abierto'); flecha.className = '';
    setTimeout(() => { raiz.hidden = true; raiz.innerHTML = ''; }, 380);
  }

  window.tendidoInstalar = {
    // La app pregunta si tiene que enseñar el botón «Instalar» y se entera si cambia
    escuchar(cb) { alCambiar = cb; avisar(); },
    abrir, cerrar,
    // La primera vez que se entra desde el navegador, el tutorial sale solo
    primeraVez() {
      if (instalada || comoApp() || guardado('tendido-tutorial')) return;
      setTimeout(() => { if (!instalada) abrir(); }, 1400);
    },
  };
})();
