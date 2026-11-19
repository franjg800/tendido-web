// Medalla de Tendido: píxel. Metal pulido y esmalte con barniz, una luz principal fija y un estudio de fondo
// que se refleja; como la luz no se mueve, al girar la medalla los reflejos recorren el metal en un solo sentido.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D tColor;   // color de la cara
uniform sampler2D tMat;     // R: metal, G: altura del relieve
uniform float uLado;        // 0 canto, 1 frente, 2 dorso
uniform vec3 uMetal;        // color del metal (sRGB)
uniform vec3 uCam;
uniform float uTexel;
uniform float uGris;        // 1 = medalla bloqueada
uniform mat3 uRot;
varying vec3 vP;
varying vec3 vN;
varying vec2 vUv;
varying float vTipo;
varying vec3 vLocal;

vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }

// Estudio fotográfico: suelo oscuro, techo templado, una caja de luz grande arriba a la izquierda,
// una tira lateral y luz suave detrás de la cámara.
vec3 estudio(vec3 d) {
    vec3 c = mix(vec3(0.035, 0.03, 0.028), vec3(0.42, 0.40, 0.37), smoothstep(-0.5, 0.9, d.y));
    c += vec3(2.6, 2.45, 2.2) * smoothstep(0.80, 0.97, dot(d, normalize(vec3(-0.55, 0.62, 0.55))));
    c += vec3(1.3, 1.3, 1.35) * smoothstep(0.90, 0.99, dot(d, normalize(vec3(0.75, 0.2, 0.62))));
    c += vec3(0.55, 0.52, 0.48) * smoothstep(0.1, 1.0, d.z);
    float franja = (d.y - 0.42) * 7.0;
    c += vec3(1.1) * exp(-franja * franja) * smoothstep(-0.3, 0.7, d.z);
    return c;
}

void main() {
    vec3 N = normalize(vN);
    vec3 alb;
    float met;
    if (uLado < 0.5) {
        alb = lin(uMetal);
        met = 1.0;
        // Estrías finas del canto, como una moneda
        float ang = atan(vLocal.y, vLocal.x);
        vec3 t = uRot * normalize(vec3(-vLocal.y, vLocal.x, 0.0));
        N = normalize(N + t * sin(ang * 180.0) * 0.18);
    } else {
        vec4 col = texture2D(tColor, vUv);
        vec4 m = texture2D(tMat, vUv);
        alb = lin(col.rgb);
        met = m.r;
        if (vTipo > 1.5) {
            // Relieve: las líneas de metal sobresalen del esmalte
            float d = uTexel * 1.5;
            float hu = texture2D(tMat, vUv + vec2(d, 0.0)).g - texture2D(tMat, vUv - vec2(d, 0.0)).g;
            float hv = texture2D(tMat, vUv + vec2(0.0, d)).g - texture2D(tMat, vUv - vec2(0.0, d)).g;
            vec3 tu = uRot * vec3(uLado < 1.5 ? 1.0 : -1.0, 0.0, 0.0);
            vec3 tv = uRot * vec3(0.0, -1.0, 0.0);
            N = normalize(N - 2.2 * (hu * tu + hv * tv));
        }
    }
    vec3 V = normalize(uCam - vP);
    vec3 R = reflect(-V, N);
    float ndv = max(dot(N, V), 0.0);
    vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
    vec3 Lc = vec3(1.0, 0.95, 0.86) * 1.6;
    vec3 L2 = normalize(vec3(0.7, -0.2, 0.5));
    vec3 L2c = vec3(0.75, 0.82, 1.0) * 0.35;
    float dif = max(dot(N, L), 0.0);
    float dif2 = max(dot(N, L2), 0.0);
    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);

    // Metal: refleja el estudio teñido de su color, con un brillo fuerte de la luz principal
    vec3 fm = alb + (1.0 - alb) * pow(1.0 - ndv, 5.0);
    vec3 cMetal = fm * (estudio(R) * 0.9 + Lc * pow(nh, 80.0) * 2.2) + alb * dif * 0.12;
    // Esmalte: color con luz difusa y una capa de barniz que refleja un poco
    float fr = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
    vec3 cEsmalte = alb * (0.2 + dif * Lc * 0.78 + dif2 * L2c) + fr * estudio(R) * 0.55 + Lc * pow(nh, 260.0) * 0.6;
    vec3 c = mix(cEsmalte, cMetal, met);

    c = c / (1.0 + c * 0.22);
    c = pow(c, vec3(1.0 / 2.2));
    float g = dot(c, vec3(0.3, 0.59, 0.11));
    c = mix(c, vec3(g * 0.75), uGris);
    gl_FragColor = vec4(c, 1.0);
}
