// tiny-stack-vm: exact interpreter for make.fun's tiny stack ISA (v1).
// Per instance in MAKEFUN_INPUT_DIR (/input): answers to MAKEFUN_OUTPUT_DIR (/output).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const ID = process.env.MAKEFUN_INPUT_DIR ?? "/input", OD = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const TE = new TextEncoder();

// [pops, pushes] per opcode.
function effect(op: number): [number, number] | null {
  switch (op) {
    case 0x00: case 0x30: case 0x33: case 0x34: return [0, 0];
    case 0x01: case 0x02: case 0x52: return [0, 1];
    case 0x03: return [1, 0]; case 0x04: return [1, 2];
    case 0x05: return [2, 2]; case 0x06: return [2, 3];
    case 0x07: return [3, 3];
    case 0x17: case 0x1b: case 0x40: return [1, 1];
    case 0x31: case 0x32: case 0x50: case 0x51: case 0x53: return [1, 0];
    case 0x41: return [2, 0];
    default: return op >= 0x10 && op <= 0x22 && op !== 0x1f ? [2, 1] : null;
  }
}
const immOf = (op: number) => op === 1 ? 1 : op === 2 ? 4 : op >= 0x30 && op <= 0x33 ? 2 : 0;

// Run a program; return [output, exit code].
function run(P: Uint8Array, inp: Uint8Array): [Uint8Array, number] {
  const n = P.length, S: number[] = [], C: number[] = [], M = new Int32Array(256), out: number[] = [];
  let pc = 0, st = 0, at = 0;
  const done = (c: number): [Uint8Array, number] => [Uint8Array.from(out), c];
  for (;;) {
    if (st >= 1e6) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = P[pc], ef = effect(op);
    if (ef === null) return done(5);
    const imm = immOf(op);
    if (pc + imm >= n) return done(9);
    st++;
    if (S.length < ef[0]) return done(2);
    if (S.length - ef[0] + ef[1] > 256) return done(3);
    const nx = pc + 1 + imm;
    pc = nx;
    if (op >= 0x10 && op <= 0x22 && op !== 0x17 && op !== 0x1b) {
      const b = S.pop()!, a = S.pop()!;
      let r: number;
      if (op >= 19 && op <= 22 && !b) return done(4);
      if (op === 16) r = a + b;
      if (op === 17) r = a - b;
      if (op === 18) r = Math.imul(a, b);
      if (op === 19) r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
      if (op === 20) r = b === -1 ? 0 : a % b;
      if (op === 21) r = Math.floor((a >>> 0) / (b >>> 0));
      if (op === 22) r = (a >>> 0) % (b >>> 0);
      if (op === 24) r = a & b;
      if (op === 25) r = a | b;
      if (op === 26) r = a ^ b;
      if (op === 28) r = a << (b & 31);
      if (op === 29) r = a >> (b & 31);
      if (op === 30) r = a >>> (b & 31);
      if (op === 32) r = a === b ? 1 : 0;
      if (op === 33) r = a < b ? 1 : 0;
      if (op === 34) r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      S.push(r! | 0);
      continue;
    }
    switch (op) {
      case 0x00: return done(0);
      case 0x01: S.push((P[nx - 1] << 24) >> 24); break;
      case 0x02: S.push(P[nx - 4] | (P[nx - 3] << 8) | (P[nx - 2] << 16) | (P[nx - 1] << 24)); break;
      case 0x03: S.pop(); break;
      case 0x04: S.push(S[S.length - 1]); break;
      case 0x05: { const t = S[S.length - 1]; S[S.length - 1] = S[S.length - 2]; S[S.length - 2] = t; break; }
      case 0x06: S.push(S[S.length - 2]); break;
      case 0x07: { const a = S[S.length - 3]; S[S.length - 3] = S[S.length - 2]; S[S.length - 2] = S[S.length - 1]; S[S.length - 1] = a; break; }
      case 0x17: S[S.length - 1] = -S[S.length - 1] | 0; break;
      case 0x1b: S[S.length - 1] = ~S[S.length - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((P[nx - 2] | (P[nx - 1] << 8)) << 16) >> 16;
        let take = op === 0x30;
        if (!take) { const v = S.pop()!; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = nx + rel;
        break;
      }
      case 0x33:
        if (C.length >= 64) return done(7);
        C.push(nx); pc = P[nx - 2] | (P[nx - 1] << 8); break;
      case 0x34:
        if (C.length === 0) return done(8);
        pc = C.pop()!; break;
      case 0x40: {
        const a = S[S.length - 1];
        if (a < 0 || a > 255) return done(6);
        S[S.length - 1] = M[a]; break;
      }
      case 0x41: {
        const a = S.pop()!;
        if (a < 0 || a > 255) return done(6);
        M[a] = S.pop()!; break;
      }
      case 0x50: {
        const bs = TE.encode(String(S[S.length - 1]));
        if (out.length + bs.length > 65536) return done(11);
        S.pop();
        out.push(...bs);
        break;
      }
      case 0x51:
        if (out.length >= 65536) return done(11);
        out.push(S.pop()! & 255); break;
      case 0x52: S.push(at < inp.length ? inp[at++] : -1); break;
      case 0x53: return done(S.pop()! & 255);
    }
  }
}

const ids = readdirSync(ID, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
for (const id of ids) {
  const prog = new Uint8Array(readFileSync(join(ID, id, "program.bin")));
  const ip = join(ID, id, "input.bin");
  const [bytes, code] = run(prog, existsSync(ip) ? new Uint8Array(readFileSync(ip)) : new Uint8Array(0));
  const dir = join(OD, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "stdout.bin"), bytes);
  writeFileSync(join(dir, "exit.txt"), code + "\n");
}
