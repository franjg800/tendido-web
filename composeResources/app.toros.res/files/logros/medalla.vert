// Medalla de Tendido: vértice. Mismo código en el móvil (OpenGL ES 2) y en el banco de pruebas (WebGL).
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aUv;
attribute float aTipo;   // 0 canto, 1 bisel, 2 cara plana
uniform mat4 uProj;
uniform mat4 uVista;
uniform mat4 uModelo;
uniform mat3 uRot;
varying vec3 vP;
varying vec3 vN;
varying vec2 vUv;
varying float vTipo;
varying vec3 vLocal;
void main() {
    vec4 w = uModelo * vec4(aPos, 1.0);
    vP = w.xyz;
    vN = uRot * aNor;
    vUv = aUv;
    vTipo = aTipo;
    vLocal = aPos;
    gl_Position = uProj * uVista * w;
}
