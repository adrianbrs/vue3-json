export function throwError(msg: string): never {
  const name = process.env.VUE_APP_NAME;
  throw new Error(`[${name}] Error: ${msg}`);
}
