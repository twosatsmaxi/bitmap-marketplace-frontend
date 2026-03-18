/**
 * WebGL2 utility helpers for instanced quad rendering.
 * Zero dependencies — uses the browser WebGL2 API directly.
 */

export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source.trim());
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "(no info)";
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  // Shaders can be deleted after linking
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

export interface InstancedQuadBuffers {
  vao: WebGLVertexArrayObject;
  instanceBuffer: WebGLBuffer;
  maxInstances: number;
}

/**
 * Sets up a VAO with a shared unit quad (2 triangles, 6 verts)
 * and a per-instance buffer for [x, y, size, index].
 */
export function setupInstancedQuads(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  maxInstances: number
): InstancedQuadBuffers {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error("Failed to create VAO");
  gl.bindVertexArray(vao);

  // Unit quad: two triangles covering [0,0]–[1,1]
  // prettier-ignore
  const quadVerts = new Float32Array([
    0, 0,  1, 0,  0, 1,
    0, 1,  1, 0,  1, 1,
  ]);
  const quadBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  const aQuadPos = gl.getAttribLocation(program, "a_quadPos");
  gl.enableVertexAttribArray(aQuadPos);
  gl.vertexAttribPointer(aQuadPos, 2, gl.FLOAT, false, 0, 0);
  // divisor = 0 → shared across instances

  // Per-instance buffer: vec4(x, y, size, index)
  const instanceBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    maxInstances * 4 * Float32Array.BYTES_PER_ELEMENT,
    gl.DYNAMIC_DRAW
  );

  const aInstanceData = gl.getAttribLocation(program, "a_instanceData");
  gl.enableVertexAttribArray(aInstanceData);
  gl.vertexAttribPointer(aInstanceData, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(aInstanceData, 1); // one per instance

  gl.bindVertexArray(null);

  return { vao, instanceBuffer, maxInstances };
}

/**
 * Sets up a VAO with a shared isometric cube geometry (3 faces x 6 verts = 18)
 * and a per-instance buffer for [x, y, size, index].
 * Each vertex is vec3(dx, dy, faceId) where faceId selects top/right/left.
 */
export function setupInstancedIsoCubes(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  maxInstances: number
): InstancedQuadBuffers {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error("Failed to create VAO");
  gl.bindVertexArray(vao);

  // 3 visible faces: top (0), right (1), left (2)
  // Each face is a quad (2 triangles, 6 vertices)
  // Vertex format: vec3(dx, dy, faceId) where dx/dy ∈ {0,1}
  // prettier-ignore
  const cubeVerts = new Float32Array([
    // Top face (faceId = 0)
    0, 0, 0,  1, 0, 0,  0, 1, 0,
    0, 1, 0,  1, 0, 0,  1, 1, 0,
    // Right face (faceId = 1)
    0, 0, 1,  1, 0, 1,  0, 1, 1,
    0, 1, 1,  1, 0, 1,  1, 1, 1,
    // Left face (faceId = 2)
    0, 0, 2,  1, 0, 2,  0, 1, 2,
    0, 1, 2,  1, 0, 2,  1, 1, 2,
  ]);
  const cubeBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);

  const aCubePos = gl.getAttribLocation(program, "a_cubePos");
  gl.enableVertexAttribArray(aCubePos);
  gl.vertexAttribPointer(aCubePos, 3, gl.FLOAT, false, 0, 0);
  // divisor = 0 → shared across instances

  // Per-instance buffer: vec4(x, y, size, index) — same format as flat
  const instanceBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    maxInstances * 4 * Float32Array.BYTES_PER_ELEMENT,
    gl.DYNAMIC_DRAW
  );

  const aInstanceData = gl.getAttribLocation(program, "a_instanceData");
  gl.enableVertexAttribArray(aInstanceData);
  gl.vertexAttribPointer(aInstanceData, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(aInstanceData, 1); // one per instance

  gl.bindVertexArray(null);

  return { vao, instanceBuffer, maxInstances };
}
