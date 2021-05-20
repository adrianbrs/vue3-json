import { reactive, Ref, ref, toRefs } from "@vue/reactivity";

export type JSONPrimitive =
  | Record<string | number, unknown>
  | Array<any>
  | string
  | number;

export type JSONTokenType = "key" | "bracket" | "string" | "number" | "null";
export type JSONTokenContext = "array" | "object" | "none";

export interface JSONToken {
  type: JSONTokenType;
  value: string | number;
  depth: number;
  context: JSONTokenContext;
  collapsed?: boolean;
  visible?: boolean;
  role?: "open" | "close";
  index?: number;
}

export interface JSONTokenLoaded extends JSONToken {
  index: number;
}

export function getTokenType(val: string | number): JSONTokenType | null {
  if (typeof val === "undefined") return null;
  else if (val === null) {
    return "null";
  } else if (typeof val === "number") {
    return "number";
  } else {
    if (["{", "}", "[", "]"].includes(val)) {
      return "bracket";
    } else if (/^[\w_-]+:$/i.test(val)) {
      return "key";
    } else {
      return "string";
    }
  }
}

export function useParser(
  val: JSONPrimitive,
  depth = 0,
  context: JSONTokenContext = "none"
): JSONTokenLoaded[] {
  let res = [] as JSONToken[];
  if (!val) return reactive(res as JSONTokenLoaded[]);

  // Object
  if (typeof val === "string") {
    res = [
      {
        type: "string",
        value: val,
        context,
        depth,
      },
    ];
  } else if (typeof val === "number") {
    res = [
      {
        type: "number",
        value: val,
        context,
        depth,
      },
    ];
  } else if (Array.isArray(val)) {
    res = [
      {
        type: "bracket",
        value: "[",
        role: "open",
        context,
        depth,
      },
      ...val.flatMap((child) => useParser(child, depth + 1, "array")),
      {
        type: "bracket",
        value: "]",
        role: "close",
        context,
        depth,
      },
    ];
  } else {
    res = [
      {
        type: "bracket",
        value: "{",
        role: "open",
        context,
        depth,
      },
      ...Object.entries(val).flatMap(
        ([key, val]: [any, any]) =>
          [
            {
              type: "key",
              value: key,
              depth: depth + 1,
            },
            ...useParser(val, depth + 1, "object"),
          ] as JSONToken[]
      ),
      {
        type: "bracket",
        value: "}",
        role: "close",
        context,
        depth,
      },
    ];
  }

  return reactive(
    res.map((el, i) => {
      el.index = i;
      return el as JSONTokenLoaded;
    })
  );
}
