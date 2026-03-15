/**
 * GLSL shaders for WebGL2 instanced bitmap rendering.
 * All animation (easing, stagger, mouse repulsion) runs on the GPU.
 */

export const vertexShader = /* glsl */ `\
#version 300 es
precision highp float;

// Shared unit quad vertex (0,0)–(1,1)
in vec2 a_quadPos;

// Per-instance: x, y, size, index (in grid units)
in vec4 a_instanceData;

// Frame uniforms
uniform float u_canvasSize;
uniform float u_layoutWidth;
uniform float u_usedHeight;
uniform float u_squareCount;
uniform float u_startTime;
uniform float u_currentTime;
uniform vec2  u_mouse;        // pixels; (-1,-1) = no mouse
uniform float u_flickerIndex; // -1 = none
uniform float u_scale;        // 1.0 normal, 0.0 imploded

out float v_brightness;
out float v_alpha;

float easeOutBack(float x) {
  float c1 = 1.70158;
  float c3 = c1 + 1.0;
  float t = x - 1.0;
  return 1.0 + c3 * t * t * t + c1 * t * t;
}

void main() {
  float x     = a_instanceData.x;
  float y     = a_instanceData.y;
  float size  = a_instanceData.z;
  float index = a_instanceData.w;

  float draw        = max(u_layoutWidth, u_usedHeight);
  float gridSize    = u_canvasSize / draw;
  float offsetY     = (u_canvasSize - u_usedHeight * gridSize) * 0.5;
  float unitPadding = gridSize * 0.25;

  // ── Timing ──
  float baseDuration  = 1400.0;
  float totalStagger  = 1200.0;
  float massFactor    = size * 50.0;
  float staggerDelay  = (index / u_squareCount) * totalStagger
                      + abs(sin(index)) * 100.0;
  float elapsed       = u_currentTime - u_startTime - staggerDelay;
  float duration      = baseDuration + massFactor;

  float overallMs     = u_currentTime - u_startTime;
  float overallProg   = clamp(overallMs / 3000.0, 0.0, 1.0);
  float currentProg   = overallProg >= 1.0
                        ? 1.0
                        : clamp(elapsed / duration, 0.0, 1.0);

  // Not yet visible → move off-screen
  if (currentProg <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    v_alpha     = 0.0;
    v_brightness = 1.0;
    return;
  }

  float eased = easeOutBack(currentProg);

  // ── Target position ──
  float tx = x;
  float ty = y;

  // Mouse repulsion (only after entry animation finishes)
  if (overallProg >= 1.0 && u_mouse.x >= 0.0) {
    float mx = u_mouse.x / gridSize;
    float my = (u_mouse.y - offsetY) / gridSize;
    float dx = tx + size * 0.5 - mx;
    float dy = ty + size * 0.5 - my;
    float dist = sqrt(dx * dx + dy * dy);
    float radius = 6.0;
    if (dist < radius && dist > 0.001) {
      float force = (1.0 - dist / radius) * 3.0;
      tx += (dx / dist) * force;
      ty += (dy / dist) * force;
    }
  }

  // ── Start position (pseudo-random, outside canvas) ──
  float angle = sin(index * 1234.56) * 6.283185307;
  float distFromCenter = (u_canvasSize / gridSize)
                       * (1.2 + cos(index * 789.1) * 0.5);
  float startX = x + cos(angle) * distFromCenter;
  float startY = y + sin(angle) * distFromCenter;

  // Interpolate start → target
  float curX = startX + (tx - startX) * eased;
  float curY = startY + (ty - startY) * eased;

  // ── Pixel coordinates ──
  float px = curX * gridSize + unitPadding;
  float py = curY * gridSize + offsetY + unitPadding;
  float pw = size * gridSize - unitPadding * 2.0;

  if (pw <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    v_alpha     = 0.0;
    v_brightness = 1.0;
    return;
  }

  // Quad vertex in pixels
  float vx = px + a_quadPos.x * pw;
  float vy = py + a_quadPos.y * pw;

  // Implode scale (shrink toward center)
  float cx = u_canvasSize * 0.5;
  float cy = u_canvasSize * 0.5;
  vx = cx + (vx - cx) * u_scale;
  vy = cy + (vy - cy) * u_scale;

  // Clip space
  gl_Position = vec4(
    (vx / u_canvasSize) * 2.0 - 1.0,
    1.0 - (vy / u_canvasSize) * 2.0,
    0.0,
    1.0
  );

  // ── Flicker ──
  bool isFlicker = abs(index - u_flickerIndex) < 0.5;
  v_brightness   = isFlicker ? 1.6 : 1.0;
  v_alpha        = isFlicker ? 1.0 : min(1.0, currentProg * 1.5);
}
`;

export const fragmentShader = /* glsl */ `\
#version 300 es
precision highp float;

uniform vec3 u_baseColor;

in float v_brightness;
in float v_alpha;

out vec4 fragColor;

void main() {
  vec3 color = min(vec3(1.0), u_baseColor * v_brightness);
  fragColor  = vec4(color, v_alpha);
}
`;
