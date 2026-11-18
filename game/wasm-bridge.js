export async function createEstuaryCore(seed, bytes) {
  bytes ??= await (await fetch(new URL('./vendor/estuary-core.wasm', import.meta.url))).arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const api = instance.exports;
  for (const name of ['init','step','command_ptr','snapshot_ptr','abi_version','state_hash']) {
    if (typeof api[name] !== 'function') throw Error(`Missing ABI export: ${name}`);
  }
  if (!(api.memory instanceof WebAssembly.Memory) || api.abi_version() !== 2) throw Error('ABI mismatch');
  api.init(seed);
  return { api, tick: 0, seed };
}
export function readEstuarySnapshot(core) {
  return new Uint32Array(core.api.memory.buffer, core.api.snapshot_ptr(), 4096).slice();
}
export function stepEstuaryCommandBuffer(core, commands = []) {
  if (commands.length > 32) throw Error('Command capacity exceeded');
  const buffer = new Uint32Array(core.api.memory.buffer, core.api.command_ptr(), 96);
  buffer.fill(0);
  commands.forEach((command, i) => buffer.set([command[0], command[1] ?? 0, command[2] ?? 0], i * 3));
  if (core.api.step(core.tick + 1, commands.length) !== 1) throw Error('Tick rejected');
  core.tick++;
  return readEstuarySnapshot(core);
}
