/**
 * Shared singleton WebGL2 context.
 * Chrome limits active WebGL contexts to ~8-16. Since the explore page
 * renders 9 cards simultaneously, we share one offscreen context and
 * copy rendered pixels to each card's visible canvas.
 */

import { createProgram, setupInstancedQuads, type InstancedQuadBuffers } from "./webgl-utils";
import { vertexShader, fragmentShader } from "./shaders";

const MAX_INSTANCES = 8192;

interface SharedGL {
  canvas: OffscreenCanvas;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  buffers: InstancedQuadBuffers;
  uniforms: Record<string, WebGLUniformLocation>;
}

let shared: SharedGL | null = null;
let refCount = 0;

const UNIFORM_NAMES = [
  "u_canvasSize",
  "u_layoutWidth",
  "u_usedHeight",
  "u_squareCount",
  "u_startTime",
  "u_currentTime",
  "u_mouse",
  "u_flickerIndex",
  "u_scale",
  "u_baseColor",
];

function getUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation> {
  const out: Record<string, WebGLUniformLocation> = {};
  for (const name of UNIFORM_NAMES) {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) out[name] = loc;
  }
  return out;
}

function init(size: number): SharedGL {
  const canvas = new OffscreenCanvas(size, size);
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true, // needed so we can copy pixels after draw
  });
  if (!gl) throw new Error("WebGL2 not available");

  const program = createProgram(gl, vertexShader, fragmentShader);
  const buffers = setupInstancedQuads(gl, program, MAX_INSTANCES);
  const uniforms = getUniforms(gl, program);

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Static uniform: base color RGB(203, 120, 37) normalized
  gl.uniform3f(uniforms.u_baseColor, 203 / 255, 120 / 255, 37 / 255);

  return { canvas, gl, program, buffers, uniforms };
}

export function acquireSharedGL(size: number): SharedGL {
  if (!shared) {
    shared = init(size);
  }
  // Resize if needed
  if (shared.canvas.width !== size || shared.canvas.height !== size) {
    shared.canvas.width = size;
    shared.canvas.height = size;
  }
  refCount++;
  return shared;
}

export function releaseSharedGL(): void {
  refCount--;
  if (refCount <= 0 && shared) {
    const { gl, program, buffers } = shared;
    gl.deleteProgram(program);
    gl.deleteVertexArray(buffers.vao);
    gl.deleteBuffer(buffers.instanceBuffer);
    shared = null;
    refCount = 0;
  }
}

export type { SharedGL };
