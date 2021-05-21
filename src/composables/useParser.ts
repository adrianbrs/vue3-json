import { reactive } from "@vue/reactivity";

export type VJTokenType = "bracket" | "string" | "number" | "null";

export interface VJToken<T extends VJTokenType> {
  type: T;
  key?: string;
  value: string | number;
  depth: number;
  parent: VJToken<VJTokenType> | null;
  collapsed?: boolean;
  visible: boolean;
  role: T extends "bracket" ? "open" | "close" : undefined;
  groupToken: T extends "bracket" ? VJToken<"bracket"> : undefined;
  index: number;
  hover?: boolean;
  childCount?: T extends "bracket" ? number : undefined;
}

export interface VJParserOptions {
  maxDepth: number;
}

export function useParser(
  val: unknown,
  options: VJParserOptions
): VJToken<VJTokenType>[] {
  const elements = parseObject(val);
  return reactive(
    elements.map((el, i) => {
      const maxDepth = options.maxDepth;

      if (maxDepth >= 0) {
        const hide = el.depth > maxDepth;
        el.visible = !hide;

        // Set collapsed
        if (el.type === "bracket" && el.depth >= maxDepth) {
          el.collapsed = true;

          if (el.groupToken) {
            el.groupToken.collapsed = true;
          }

          if (el.role === "close") {
            el.visible = false;
          }
        }
      }

      el.index = i;
      return el;
    })
  );
}

function parseObject(
  val: unknown[] | unknown,
  depth = 0,
  parent: VJToken<VJTokenType> | null = null,
  key: string | number | null = null
): VJToken<VJTokenType>[] {
  if (typeof val === "undefined") return [];

  // Object
  if (typeof val === "string") {
    return [
      {
        type: "string",
        value: val,
        depth,
        key,
        parent,
      } as VJToken<"string">,
    ];
  } else if (typeof val === "number") {
    return [
      {
        type: "number",
        value: val,
        depth,
        key,
        parent,
      } as VJToken<"number">,
    ];
  } else if (val === null) {
    return [
      {
        type: "null",
        value: "null",
        depth,
        key,
        parent,
      } as VJToken<"null">,
    ];
  } else {
    const isArray = Array.isArray(val);
    const entries: Array<unknown> = !isArray
      ? Object.entries(val as unknown[])
      : (val as Array<unknown>);

    const open = {
      type: "bracket",
      value: isArray ? "[" : "{",
      role: "open",
      parent,
      key,
      depth,
      childCount: entries.length,
    } as VJToken<"bracket">;

    const close = {
      type: "bracket",
      value: isArray ? "]" : "}",
      role: "close",
      parent,
      depth,
      groupToken: open,
      childCount: entries.length,
    } as VJToken<"bracket">;

    // Set open bracket groupToken
    open.groupToken = close;

    let children;
    if (isArray) {
      children = entries.flatMap<VJToken<VJTokenType>>((child) =>
        parseObject(child, depth + 1, open)
      );
    } else {
      children = (entries as Array<Array<unknown | unknown>>).flatMap(
        ([key, value]: Array<unknown | string | number>) =>
          parseObject(value, depth + 1, open, key as string | number)
      );
    }

    return [open, ...children, close];
  }
}
