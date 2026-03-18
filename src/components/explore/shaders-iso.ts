/**
 * GLSL shaders for isometric 3D instanced bitmap rendering.
 * Same animation logic as flat shaders, but projects tiles as extruded blocks
 * from a fixed isometric camera angle. Three visible faces per block:
 * top (bright), right (medium), left (dark).
 */

export const isoVertexShader = `#version 300 es
precision highp float;

// Per-vertex: dx, dy, faceId (0=top, 1=right, 2=left)
in vec3 a_cubePos;

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
uniform float u_enableRepulsion;
uniform float u_enableFlicker;
uniform float u_tileHeightScale; // 0.0 = flat, 1.0 = full extrusion

out float v_brightness;
out float v_alpha;
out float v_proximityGlow;
out float v_faceBrightness;

const float COS30 = 0.866025;
const float SIN30 = 0.5;

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

  float dx = a_cubePos.x;
  float dy = a_cubePos.y;
  float faceId = a_cubePos.z;

  // Block height: capped and scaled
  float blockHeight = min(size, 8.0) * u_tileHeightScale;

  // Compute iso viewport scaling (used for projection and mouse inverse)
  float isoSpanX = (u_layoutWidth + u_usedHeight) * COS30;
  float isoSpanY = (u_layoutWidth + u_usedHeight) * SIN30 + 8.0 * u_tileHeightScale;
  float isoSpan  = max(isoSpanX, isoSpanY);
  float isoScale = u_canvasSize / (isoSpan * 1.15);

  float centerIsoX = (u_layoutWidth - u_usedHeight) * COS30 * 0.5;
  float centerIsoY = (u_layoutWidth + u_usedHeight) * SIN30 * 0.5
                   - 4.0 * u_tileHeightScale;

  // ---- Timing (identical to flat shader) ----
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

  // Not yet visible — move off-screen
  if (currentProg <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    v_alpha = 0.0;
    v_brightness = 1.0;
    v_proximityGlow = 0.0;
    v_faceBrightness = 1.0;
    return;
  }

  float eased = easeOutBack(currentProg);

  // ---- Target position in grid space ----
  float tx = x;
  float ty = y;
  float shrinkFactor = 1.0;
  v_proximityGlow = 0.0;

  // Mouse repulsion: inverse-project mouse to grid space, then repel
  if (u_enableRepulsion > 0.5 && overallProg >= 1.0 && u_mouse.x >= 0.0) {
    // Screen pixels → centered iso space
    float mIsoX = (u_mouse.x - u_canvasSize * 0.5) / isoScale + centerIsoX;
    float mIsoY = (u_mouse.y - u_canvasSize * 0.5) / isoScale + centerIsoY;
    // Inverse iso projection at z=0 ground plane
    float mx = (mIsoX / COS30 + mIsoY / SIN30) * 0.5;
    float my = (mIsoY / SIN30 - mIsoX / COS30) * 0.5;

    float ddx = tx + size * 0.5 - mx;
    float ddy = ty + size * 0.5 - my;
    float dist = sqrt(ddx * ddx + ddy * ddy);
    float radius = 18.0;
    if (dist < radius && dist > 0.001) {
      float sFactor = smoothstep(0.0, radius, dist);
      if (size <= 1.0) {
        v_proximityGlow = 1.0 - sFactor;
      } else {
        float force = (1.0 - dist / radius) * 5.0;
        tx += (ddx / dist) * force;
        ty += (ddy / dist) * force;
        shrinkFactor = sFactor;
        if (size <= 4.0) {
          v_proximityGlow = 1.0 - shrinkFactor;
          shrinkFactor = max(shrinkFactor, 0.5);
        }
      }
    }
  }

  // ---- Entry animation: fly in from outside ----
  float angle = sin(index * 1234.56) * 6.283185307;
  float distFromCenter = max(u_layoutWidth, u_usedHeight)
                       * (1.2 + cos(index * 789.1) * 0.5);
  float startX = x + cos(angle) * distFromCenter;
  float startY = y + sin(angle) * distFromCenter;

  float curX = startX + (tx - startX) * eased;
  float curY = startY + (ty - startY) * eased;

  // ---- Padding & shrink in grid space ----
  float pad = 0.12;
  float innerSize = size - pad * 2.0;
  float effSize   = innerSize * shrinkFactor;
  float effHeight = blockHeight * shrinkFactor;

  if (effSize <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    v_alpha = 0.0;
    v_brightness = 1.0;
    v_proximityGlow = 0.0;
    v_faceBrightness = 1.0;
    return;
  }

  // Shrink toward tile center
  float bx = curX + pad + (innerSize - effSize) * 0.5;
  float by = curY + pad + (innerSize - effSize) * 0.5;

  // ---- 3D corner from face ID ----
  vec3 corner;
  if (faceId < 0.5) {
    // Top face: z = effHeight
    corner = vec3(bx + dx * effSize, by + dy * effSize, effHeight);
  } else if (faceId < 1.5) {
    // Right face: x = bx + effSize
    corner = vec3(bx + effSize, by + dx * effSize, dy * effHeight);
  } else {
    // Left face: y = by + effSize
    corner = vec3(bx + dx * effSize, by + effSize, dy * effHeight);
  }

  // ---- Isometric projection ----
  float isoX = (corner.x - corner.y) * COS30;
  float isoY = (corner.x + corner.y) * SIN30 - corner.z;

  // Screen pixel position
  float px = (isoX - centerIsoX) * isoScale + u_canvasSize * 0.5;
  float py = (isoY - centerIsoY) * isoScale + u_canvasSize * 0.5;

  // Implode scale (shrink toward canvas center)
  float cx = u_canvasSize * 0.5;
  float cy = u_canvasSize * 0.5;
  px = cx + (px - cx) * u_scale;
  py = cy + (py - cy) * u_scale;

  // Depth: higher (x+y+z) = closer to camera = smaller depth value
  float maxRange = u_layoutWidth + u_usedHeight + 8.0 * u_tileHeightScale;
  float depth = 1.0 - 2.0 * (corner.x + corner.y + corner.z)
              / max(maxRange, 1.0);

  gl_Position = vec4(
    (px / u_canvasSize) * 2.0 - 1.0,
    1.0 - (py / u_canvasSize) * 2.0,
    depth,
    1.0
  );

  // ---- Face-dependent shading ----
  if (faceId < 0.5) {
    v_faceBrightness = 1.0;  // top — full light
  } else if (faceId < 1.5) {
    v_faceBrightness = 0.7;  // right — medium
  } else {
    v_faceBrightness = 0.5;  // left — dark
  }

  // Flicker
  bool isFlicker = u_enableFlicker > 0.5 && abs(index - u_flickerIndex) < 0.5;
  float glowBrightness = 1.0 + v_proximityGlow * 1.2;
  v_brightness = isFlicker ? 1.6 : glowBrightness;
  v_alpha      = isFlicker ? 1.0 : min(1.0, currentProg * 1.5);
}
`;

export const isoFragmentShader = `#version 300 es
precision highp float;

uniform vec3 u_baseColor;

in float v_brightness;
in float v_alpha;
in float v_proximityGlow;
in float v_faceBrightness;

out vec4 fragColor;

void main() {
  vec3 color = min(vec3(1.0), u_baseColor * v_brightness * v_faceBrightness);
  fragColor  = vec4(color, v_alpha);
}
`;
