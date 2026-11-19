// Medallas de Tendido en 3D con WebGL: el mismo motor que en Android (misma malla, mismas texturas y mismos
// shaders), dibujado en un lienzo transparente que se coloca justo encima del hueco que deja la app.
(function () {
  const RAIZ = 'composeResources/app.toros.res/files/logros/';
  const CAMARA = 5.8, MEDIA_APERTURA = 12;
  const shaders = Promise.all(['medalla.vert', 'medalla.frag'].map(n => fetch(RAIZ + n).then(r => r.text())));
  const vistas = new Map();

  function mul(a, b) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; }
    return r;
  }

  async function bitmap(url) {
    const b = await (await fetch(url)).blob();
    return createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  }

  class Vista {
    constructor(id) {
      this.id = id;
      this.lienzo = document.createElement('canvas');
      this.lienzo.className = 'medalla3d';
      this.lienzo.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:5;visibility:hidden';
      document.body.appendChild(this.lienzo);
      const op = { alpha: true, premultipliedAlpha: false, antialias: true, depth: true, preserveDrawingBuffer: false };
      this.gl = this.lienzo.getContext('webgl2', op) || this.lienzo.getContext('webgl', op);
      this.giro = 0; this.inc = 0.1; this.gris = 0; this.pendiente = false; this.lista = false; this.visible = true;
      this.caja = null;
    }

    async cargar(nombre, metal, alListo) {
      const gl = this.gl; if (!gl) return;
      this.metal = metal; this.alListo = alListo;
      const base = RAIZ + nombre + '/';
      const [[vs, fs], malla, ...imgs] = await Promise.all([
        shaders, fetch(base + 'malla.bin').then(r => r.arrayBuffer()),
        bitmap(base + 'cara.webp'), bitmap(base + 'cara_mat.png'), bitmap(base + 'dorso.webp'), bitmap(base + 'dorso_mat.png'),
      ]);
      if (this.muerta) return;
      const comp = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; };
      const p = gl.createProgram();
      gl.attachShader(p, comp(gl.VERTEX_SHADER, vs)); gl.attachShader(p, comp(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      this.p = p;
      const dv = new DataView(malla);
      const nv = dv.getInt32(0, true);
      this.rangos = Array.from({ length: 6 }, (_, i) => dv.getInt32(4 + i * 4, true));
      const verts = new Float32Array(malla.slice(28, 28 + nv * 36));
      const idx = new Uint16Array(malla.slice(28 + nv * 36));
      this.vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      this.ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      const ani = gl.getExtension('EXT_texture_filter_anisotropic');
      this.tex = imgs.map(img => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (ani) gl.texParameterf(gl.TEXTURE_2D, ani.TEXTURE_MAX_ANISOTROPY_EXT, 8);
        img.close && img.close();
        return t;
      });
      this.u = {};
      ['uProj', 'uVista', 'uModelo', 'uRot', 'uMetal', 'uCam', 'uTexel', 'uGris', 'tColor', 'tMat', 'uLado'].forEach(n => this.u[n] = gl.getUniformLocation(p, n));
      this.a = ['aPos', 'aNor', 'aUv', 'aTipo'].map(n => gl.getAttribLocation(p, n));
      this.listaGL = true;
      this.pedir();
    }

    // Posición en píxeles CSS: la caja entera y la parte que se ve (recortada por las listas que se desplazan)
    colocar(x, y, w, h, cx0, cy0, cx1, cy1) {
      const app = document.getElementById('app').getBoundingClientRect();
      const s = this.lienzo.style;
      s.left = (app.left + x) + 'px'; s.top = (app.top + y) + 'px'; s.width = w + 'px'; s.height = h + 'px';
      const arriba = Math.max(0, cy0 - y), izq = Math.max(0, cx0 - x), abajo = Math.max(0, y + h - cy1), der = Math.max(0, x + w - cx1);
      s.clipPath = (arriba || izq || abajo || der) ? `inset(${arriba}px ${der}px ${abajo}px ${izq}px)` : '';
      this.visible = cx1 > cx0 && cy1 > cy0;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      if (this.lienzo.width !== pw || this.lienzo.height !== ph) { this.lienzo.width = pw; this.lienzo.height = ph; }
      this.mostrar();
      this.pedir();
    }

    poner(giro, inc, gris) { this.giro = giro; this.inc = inc; this.gris = gris ? 1 : 0; this.pedir(); }

    mostrar() { this.lienzo.style.visibility = (this.lista && this.visible) ? 'visible' : 'hidden'; }

    pedir() {
      if (this.pendiente) return;
      this.pendiente = true;
      requestAnimationFrame(() => { this.pendiente = false; this.dibujar(); });
    }

    dibujar() {
      const gl = this.gl;
      if (!gl || !this.listaGL || this.muerta || !this.lienzo.width) return;
      gl.viewport(0, 0, this.lienzo.width, this.lienzo.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(this.p);
      const f = 1 / Math.tan(MEDIA_APERTURA * Math.PI / 180), nr = 0.1, fr = 50;
      const proj = new Float32Array([f, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + nr) / (nr - fr), -1, 0, 0, 2 * fr * nr / (nr - fr), 0]);
      const vista = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -CAMARA, 1]);
      const a = this.giro * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(this.inc), st = Math.sin(this.inc);
      const ry = [ca, 0, -sa, 0, 0, 1, 0, 0, sa, 0, ca, 0, 0, 0, 0, 1];
      const rx = [1, 0, 0, 0, 0, ct, st, 0, 0, -st, ct, 0, 0, 0, 0, 1];
      const m = mul(rx, ry);
      const r3 = new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
      const u = this.u;
      gl.uniformMatrix4fv(u.uProj, false, proj);
      gl.uniformMatrix4fv(u.uVista, false, vista);
      gl.uniformMatrix4fv(u.uModelo, false, m);
      gl.uniformMatrix3fv(u.uRot, false, r3);
      gl.uniform3f(u.uMetal, this.metal[0], this.metal[1], this.metal[2]);
      gl.uniform3f(u.uCam, 0, 0, CAMARA);
      gl.uniform1f(u.uTexel, 1 / 1024);
      gl.uniform1f(u.uGris, this.gris);
      gl.uniform1i(u.tColor, 0);
      gl.uniform1i(u.tMat, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
      [[3, 0], [3, 12], [2, 24], [1, 32]].forEach(([n, o], i) => {
        const l = this.a[i];
        if (l >= 0) { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 36, o); }
      });
      for (let lado = 0; lado < 3; lado++) {
        gl.uniform1f(u.uLado, lado);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[lado === 2 ? 2 : 0]);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[lado === 2 ? 3 : 1]);
        gl.drawElements(gl.TRIANGLES, this.rangos[lado * 2 + 1], gl.UNSIGNED_SHORT, this.rangos[lado * 2] * 2);
      }
      if (!this.lista) {
        this.lista = true;
        // Se enseña en el siguiente fotograma, a la vez que la app quita la imagen fija de debajo
        requestAnimationFrame(() => { this.mostrar(); this.alListo && this.alListo(); });
      }
    }

    quitar() {
      this.muerta = true;
      const gl = this.gl;
      if (gl) { const e = gl.getExtension('WEBGL_lose_context'); e && e.loseContext(); }
      this.lienzo.remove();
    }
  }

  window.tendidoMedalla = {
    // ¿Hay WebGL? Si no, la app se queda con la medalla de frente
    puede() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } },
    crear(id, nombre, r, g, b, alListo) { const v = new Vista(id); vistas.set(id, v); v.cargar(nombre, [r, g, b], alListo).catch(e => console.error(e)); },
    colocar(id, x, y, w, h, cx0, cy0, cx1, cy1) { const v = vistas.get(id); v && v.colocar(x, y, w, h, cx0, cy0, cx1, cy1); },
    poner(id, giro, inc, gris) { const v = vistas.get(id); v && v.poner(giro, inc, gris); },
    quitar(id) { const v = vistas.get(id); if (v) { v.quitar(); vistas.delete(id); } },
  };
})();
