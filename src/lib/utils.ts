import { VJToken, VJTokenType } from "@/types";

export function throwError(msg: string): never {
  const name = process.env.VUE_APP_NAME;
  throw new Error(`[${name}] ${msg}`);
}

export function getTokenWidth(token: VJToken<VJTokenType>) {
  let width = token.depth;
  if (token.key) width += `${token.key}`.length;
  if (token.value) width += `${token.value}`.length;
  return width;
}

export function isGroupType(type: string) {
  return ["array", "object"].includes(type);
}

export function findTokenIndex(
  list: VJToken<VJTokenType>[],
  searchToken: VJToken<VJTokenType>
) {
  let start = 0;
  let end = list.length;
  let mid: number = ~~(end / 2);
  let oldMid: number;
  let token: VJToken<VJTokenType>;

  do {
    oldMid = mid;
    token = list[mid];

    if (token.index < searchToken.index) {
      start = mid;
    } else if (token.index > searchToken.index) {
      end = mid;
    }

    mid = ~~((start + end) / 2);
  } while (oldMid !== mid && start <= end);

  return mid;
}
