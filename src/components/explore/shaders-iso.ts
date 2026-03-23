/**
 * GLSL shaders for isometric 3D instanced bitmap rendering.
 * Same animation logic as flat shaders, but projects tiles as extruded blocks
 * from a fixed isometric camera angle. Three visible faces per block:
 * top (bright), right (medium), left (dark).
 * 
 * 2D→3D Transition: Two-stage animation
 * - Stage 1 (0.0-0.5): Rotate from flat 2D to isometric while keeping tiles flat
 * - Stage 2 (0.5-1.0): Extrude 3D height from flat isometric tiles
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
uniform float u_tileHeightScale; // 0.0 = flat 2D, 1.0 = full 3D

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

  // ---- 2D→3D Transition stages ----
  float transition = clamp(u_tileHeightScale, 0.0, 1.0);
  // Stage 1 (0.0-0.5): rotation only
  // Stage 2 (0.5-1.0): height extrusion
  float rotationProgress;
  float heightProgress;
  
  if (transition <= 0.0) {
    rotationProgress = 0.0;
    heightProgress = 0.0;
  } else if (transition >= 1.0) {
    rotationProgress = 1.0;
    heightProgress = 1.0;
  } else if (transition < 0.5) {
    // First half: rotation from 0 to 1, no height
    rotationProgress = transition * 2.0;  // 0 -> 1
    heightProgress = 0.0;
  } else {
    // Second half: rotation stays at 1, height grows
    rotationProgress = 1.0;
    heightProgress = (transition - 0.5) * 2.0;  // 0 -> 1
  }

  // ---- Grid calculations for flat mode (same as flat shader) ----
  float draw = max(u_layoutWidth, u_usedHeight);
  float gridSize = u_canvasSize / draw;
  float offsetY = (u_canvasSize - u_usedHeight * gridSize) * 0.5;

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

  // ============================================
  // ISOMETRIC 3D CALCULATION (exactly like original)
  // ============================================
  
  // Block height: capped and scaled
  // Original: blockHeight = min(size, 8.0) * u_tileHeightScale
  // We use heightProgress for smooth growth during transition
  float isoBlockHeight = min(size, 8.0) * heightProgress;

  // Compute iso viewport scaling (using heightProgress for dynamic viewport)
  float isoSpanX = (u_layoutWidth + u_usedHeight) * COS30;
  float isoSpanY = (u_layoutWidth + u_usedHeight) * SIN30 + 8.0 * heightProgress;
  float isoSpan  = max(isoSpanX, isoSpanY);
  float isoScale = u_canvasSize / (isoSpan * 1.15);

  float centerIsoX = (u_layoutWidth - u_usedHeight) * COS30 * 0.5;
  float centerIsoY = (u_layoutWidth + u_usedHeight) * SIN30 * 0.5
                   - 4.0 * heightProgress;

  // Mouse repulsion: inverse-project mouse to grid space, then repel
  // EXACTLY like original: check u_enableRepulsion only
  if (u_enableRepulsion > 0.5 && overallProg >= 1.0 && u_mouse.x >= 0.0) {
    float mIsoX = (u_mouse.x - u_canvasSize * 0.5) / isoScale + centerIsoX;
    float mIsoY = (u_mouse.y - u_canvasSize * 0.5) / isoScale + centerIsoY;
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

  // Entry animation: fly in from outside
  float angle = sin(index * 1234.56) * 6.283185307;
  float distFromCenter = max(u_layoutWidth, u_usedHeight)
                       * (1.2 + cos(index * 789.1) * 0.5);
  float startX = x + cos(angle) * distFromCenter;
  float startY = y + sin(angle) * distFromCenter;

  float curX = startX + (tx - startX) * eased;
  float curY = startY + (ty - startY) * eased;

  // Padding & shrink in grid space
  float pad = 0.12;
  float innerSize = size - pad * 2.0;
  float effSize   = innerSize * shrinkFactor;
  float effHeight = isoBlockHeight * shrinkFactor;

  // Shrink toward tile center
  float bx = curX + pad + (innerSize - effSize) * 0.5;
  float by = curY + pad + (innerSize - effSize) * 0.5;

  // 3D corner from face ID
  vec3 corner;
  if (faceId < 0.5) {
    corner = vec3(bx + dx * effSize, by + dy * effSize, effHeight);
  } else if (faceId < 1.5) {
    corner = vec3(bx + effSize, by + dx * effSize, dy * effHeight);
  } else {
    corner = vec3(bx + dx * effSize, by + effSize, dy * effHeight);
  }

  // Isometric projection
  float cornerIsoX = (corner.x - corner.y) * COS30;
  float cornerIsoY = (corner.x + corner.y) * SIN30 - corner.z;

  float isoPx = (cornerIsoX - centerIsoX) * isoScale + u_canvasSize * 0.5;
  float isoPy = (cornerIsoY - centerIsoY) * isoScale + u_canvasSize * 0.5;

  // ============================================
  // FLAT 2D CALCULATION (for blending)
  // ============================================
  
  // When rotationProgress = 0, we need flat 2D position
  // Calculate fresh without mouse repulsion (flat view doesn't have repulsion)
  float flatTx = x;
  float flatTy = y;
  
  // Entry animation for flat (same calculation, no mouse repulsion)
  float flatCurX = startX + (flatTx - startX) * eased;
  float flatCurY = startY + (flatTy - startY) * eased;
  
  // Flat uses different padding
  float flatPad = 0.25;
  float flatInnerSize = size - flatPad * 2.0;
  // No shrink in flat mode (or use 1.0)
  float flatEffSize = flatInnerSize;
  
  // Position with flat padding
  float flatBx = flatCurX + flatPad + (flatInnerSize - flatEffSize) * 0.5;
  float flatBy = flatCurY + flatPad + (flatInnerSize - flatEffSize) * 0.5;
  
  // Pixel coordinates
  float flatPx = flatBx * gridSize;
  float flatPy = flatBy * gridSize + offsetY;
  float flatPw = flatEffSize * gridSize;
  
  // Snap to integer pixels
  flatPx = floor(flatPx);
  flatPy = floor(flatPy);
  flatPw = ceil(flatPw);
  
  // Quad vertex in pixels
  float flatVx = flatPx + dx * flatPw;
  float flatVy = flatPy + dy * flatPw;

  // ============================================
  // BLEND between flat and isometric
  // ============================================
  float finalPx;
  float finalPy;
  
  if (rotationProgress <= 0.0) {
    finalPx = flatVx;
    finalPy = flatVy;
  } else if (rotationProgress >= 1.0) {
    finalPx = isoPx;
    finalPy = isoPy;
  } else {
    finalPx = mix(flatVx, isoPx, rotationProgress);
    finalPy = mix(flatVy, isoPy, rotationProgress);
  }

  // Implode scale
  float cx = u_canvasSize * 0.5;
  float cy = u_canvasSize * 0.5;
  finalPx = cx + (finalPx - cx) * u_scale;
  finalPy = cy + (finalPy - cy) * u_scale;

  // Depth
  float depth;
  if (rotationProgress <= 0.0) {
    depth = 0.0;
  } else {
    float maxRange = u_layoutWidth + u_usedHeight + 8.0 * heightProgress;
    float isoDepth = 1.0 - 2.0 * (corner.x + corner.y + corner.z) / max(maxRange, 1.0);
    if (rotationProgress >= 1.0) {
      depth = isoDepth;
    } else {
      depth = isoDepth * rotationProgress;
    }
  }

  gl_Position = vec4(
    (finalPx / u_canvasSize) * 2.0 - 1.0,
    1.0 - (finalPy / u_canvasSize) * 2.0,
    depth,
    1.0
  );

  // ---- Face-dependent shading ----
  if (faceId < 0.5) {
    v_faceBrightness = 1.0;  // top is always 1.0
  } else if (faceId < 1.5) {
    // right: 1.0 in flat, 0.7 in iso
    if (rotationProgress <= 0.0) v_faceBrightness = 1.0;
    else if (rotationProgress >= 1.0) v_faceBrightness = 0.7;
    else v_faceBrightness = 1.0 - rotationProgress * 0.3;
  } else {
    // left: 1.0 in flat, 0.5 in iso
    if (rotationProgress <= 0.0) v_faceBrightness = 1.0;
    else if (rotationProgress >= 1.0) v_faceBrightness = 0.5;
    else v_faceBrightness = 1.0 - rotationProgress * 0.5;
  }

  // Side faces fade in as we rotate to isometric
  float sideFaceAlpha;
  if (rotationProgress <= 0.0) sideFaceAlpha = 0.0;
  else if (rotationProgress >= 1.0) sideFaceAlpha = 1.0;
  else sideFaceAlpha = rotationProgress;

  // Flicker
  bool isFlicker = u_enableFlicker > 0.5 && abs(index - u_flickerIndex) < 0.5;
  float glowBrightness = 1.0 + v_proximityGlow * 1.2;
  v_brightness = isFlicker ? 1.6 : glowBrightness;
  
  float baseAlpha = isFlicker ? 1.0 : min(1.0, currentProg * 1.5);
  
  if (faceId > 0.5) {
    v_alpha = baseAlpha * sideFaceAlpha;
  } else {
    v_alpha = baseAlpha;
  }
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
