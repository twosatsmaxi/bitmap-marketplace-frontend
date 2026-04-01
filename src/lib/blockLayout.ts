/**
 * Bitcoin Block Layout Engine (Node.js compatible)
 * 
 * Ports the Mondrian layout algorithm from the WASM/Worker
 * for server-side PNG generation of transaction-based bitmaps.
 */

export interface TxSquare {
  index: number;
  x: number;
  y: number;
  r: number; // size (square)
}

interface Slot {
  x: number;
  y: number;
  r: number;
}

interface Row {
  y: number;
  slots: Slot[];
  map: Record<number, Slot>;
}

class MondrianLayout {
  width: number;
  rowOffset = 0;
  rows: Row[] = [];

  constructor(width: number) {
    this.width = width;
  }

  private getRow(y: number): Row | undefined {
    return this.rows[y - this.rowOffset];
  }

  private getSlot(x: number, y: number): Slot | undefined {
    const r = this.getRow(y);
    return r?.map[x];
  }

  private addRow(): Row {
    const y = this.rows.length + this.rowOffset;
    const row: Row = { y, slots: [], map: {} };
    this.rows.push(row);
    return row;
  }

  private addSlot(slot: Slot): Slot | undefined {
    if (slot.r <= 0) return;
    const existing = this.getSlot(slot.x, slot.y);
    if (existing) {
      if (slot.r > existing.r) existing.r = slot.r;
      return existing;
    }
    const row = this.getRow(slot.y);
    if (!row) return;

    let insertAt: number | null = null;
    for (let i = 0; i < row.slots.length; i++) {
      if (row.slots[i].x > slot.x) {
        insertAt = i;
        break;
      }
    }
    if (insertAt === null) row.slots.push(slot);
    else row.slots.splice(insertAt, 0, slot);
    row.map[slot.x] = slot;
    return slot;
  }

  private removeSlot(slot: Slot): void {
    const row = this.getRow(slot.y);
    if (row) {
      delete row.map[slot.x];
      const i = row.slots.indexOf(slot);
      if (i >= 0) row.slots.splice(i, 1);
    }
  }

  private fillSlot(slot: Slot, sw: number): { x: number; y: number; r: number } {
    const sq = { x: slot.x, y: slot.y, r: sw };
    this.removeSlot(slot);

    // Fill rows that the square occupies
    for (let ri = slot.y; ri < slot.y + sw; ri++) {
      let row = this.getRow(ri);
      if (row) {
        const collisions: Slot[] = [];
        let maxExcess = 0;
        for (const ts of [...row.slots]) {
          if (!(ts.x + ts.r <= sq.x || ts.x >= sq.x + sw)) {
            collisions.push(ts);
            maxExcess = Math.max(maxExcess, Math.max(0, ts.x + ts.r - (slot.x + slot.r)));
          }
        }
        if (sq.x + sw < this.width && !row.map[sq.x + sw]) {
          this.addSlot({ x: sq.x + sw, y: ri, r: slot.r - sw + maxExcess });
        }
        for (const col of collisions) {
          col.r = slot.x - col.x;
          if (col.r <= 0) this.removeSlot(col);
        }
      } else {
        this.addRow();
        if (slot.x > 0) this.addSlot({ x: 0, y: ri, r: slot.x });
        if (sq.x + sw < this.width) {
          this.addSlot({ x: sq.x + sw, y: ri, r: this.width - (sq.x + sw) });
        }
      }
    }

    // Shrink slots above that would overlap
    for (let ri = Math.max(0, slot.y - sw); ri < slot.y; ri++) {
      const row = this.getRow(ri);
      if (!row) continue;
      for (const ts of [...row.slots]) {
        if (ts.x < sq.x + sw && ts.x + ts.r > sq.x && ts.y + ts.r >= slot.y) {
          const oldW = ts.r;
          ts.r = slot.y - ts.y;
          if (ts.r <= 0) {
            this.removeSlot(ts);
            continue;
          }
          let rem = { x: ts.x + ts.r, y: ts.y, w: oldW - ts.r, h: ts.r };
          while (rem.w > 0 && rem.h > 0) {
            if (rem.w <= rem.h) {
              this.addSlot({ x: rem.x, y: rem.y, r: rem.w });
              rem.y += rem.w;
              rem.h -= rem.w;
            } else {
              this.addSlot({ x: rem.x, y: rem.y, r: rem.h });
              rem.x += rem.h;
              rem.w -= rem.h;
            }
          }
        }
      }
    }

    return sq;
  }

  place(size: number): { x: number; y: number; r: number } | null {
    for (const row of this.rows) {
      for (const slot of [...row.slots]) {
        if (slot.r >= size) {
          return this.fillSlot(slot, size);
        }
      }
    }
    const newRow = this.addRow();
    const slot: Slot = { x: 0, y: newRow.y, r: this.width };
    newRow.slots.push(slot);
    newRow.map[0] = slot;
    return this.fillSlot(slot, size);
  }

  get usedHeight(): number {
    let max = 0;
    for (const row of this.rows) {
      for (const slot of row.slots) {
        // Actually need to track placed squares
      }
    }
    // Calculate from row count
    return this.rows.length > 0 ? this.rows[this.rows.length - 1].y + 1 : 0;
  }
}

export interface LayoutResult {
  squares: TxSquare[];
  layoutWidth: number;
  usedHeight: number;
  txCount: number;
}

/**
 * Parse binary transaction data from backend
 * Each byte represents a transaction's visual size
 */
export function parseBinaryTxs(buffer: ArrayBuffer): { index: number; size: number }[] {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (size, index) => ({ index, size: size || 1 }));
}

/**
 * Layout transactions using Mondrian slot-packing algorithm
 */
export function layoutBlock(txs: { index: number; size: number }[]): {
  squares: TxSquare[];
  layoutWidth: number;
  usedHeight: number;
} {
  const sizedTxs = txs.map(tx => ({ ...tx, _size: tx.size }));
  
  // Calculate grid width based on total weight
  let weight = 0;
  for (const tx of sizedTxs) {
    weight += tx._size * tx._size;
  }
  const width = Math.ceil(Math.sqrt(weight));
  
  const layout = new MondrianLayout(width);
  const squares: TxSquare[] = [];
  
  for (const tx of sizedTxs) {
    const sq = layout.place(tx._size);
    if (sq) {
      squares.push({
        index: tx.index,
        x: sq.x,
        y: sq.y,
        r: sq.r,
      });
    }
  }

  // Calculate actual used height
  let usedHeight = 0;
  for (const sq of squares) {
    usedHeight = Math.max(usedHeight, sq.y + sq.r);
  }

  return { squares, layoutWidth: width, usedHeight };
}

/**
 * Full pipeline: buffer → layout result
 */
export function processBlockBuffer(buffer: ArrayBuffer): LayoutResult {
  const txs = parseBinaryTxs(buffer);
  const { squares, layoutWidth, usedHeight } = layoutBlock(txs);
  return {
    squares,
    layoutWidth,
    usedHeight,
    txCount: txs.length,
  };
}
