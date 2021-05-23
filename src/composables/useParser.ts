import { throwError } from "@/lib/utils";
import { reactive } from "@vue/reactivity";

const validTokenTypes = [
  "array",
  "object",
  "string",
  "number",
  "boolean",
  "null",
] as const;

export type VJTokenType = typeof validTokenTypes[number];
export type VJValueTokenType = Exclude<VJTokenType, "array" | "object">;
export type VJTreeTokenType = "array" | "object";

export type VJJSONValue =
  | string
  | number
  | boolean
  | { [key: string]: VJJSONValue }
  | VJJSONValue[]
  | null;
export type VJJSONLiteral = string | number | boolean | null;

export interface VJToken<T extends VJTokenType> {
  type: T;
  key?: string;
  value: VJJSONLiteral;
  depth: number;
  parent: VJToken<VJTokenType> | null;
  collapsed?: boolean;
  visible: boolean;
  index: number;
  hover: boolean;
  hasNext: boolean;
  role: T extends VJTreeTokenType ? "open" | "close" : undefined;
  siblingIndex: T extends VJTreeTokenType ? number : undefined;
  childCount: T extends VJTreeTokenType ? number : undefined;
}

interface ParserIterationOptions {
  depth: number;
  parent: VJToken<VJTokenType> | null;
  key: string | null;
  hasNext: boolean;
  index: number;
}

export interface VJParserOptions {
  maxDepth: number;
}

export function useParser(
  val: VJJSONValue,
  options: VJParserOptions
): VJToken<VJTokenType>[] {
  const elements = parseObject(val);
  return reactive(
    elements.map((el, i) => {
      console.log(el.index, i);
      // const maxDepth = options.maxDepth;

      // if (maxDepth >= 0 && el.depth >= maxDepth) {
      //   const hide = el.depth > maxDepth;
      //   el.visible = !hide;
      //   el.collapsed = true;

      //   // if (el.type === "bracket") {
      //   //   el.collapsed = true;

      //   //   if (el.groupToken) {
      //   //     el.groupToken.collapsed = true;
      //   //   }

      //   //   if (el.role === "close" && !hide) {
      //   //     el.visible = false;
      //   //   }
      //   // }
      // } else {
      //   el.visible = true;
      // }

      el.visible = true;
      return el;
    })
  );
}

function getObjectType(obj: unknown) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

function isTypeValid(type: string) {
  return validTokenTypes.includes(type as VJTokenType);
}

function parseObject(
  obj: VJJSONValue,
  options: ParserIterationOptions = {
    depth: 0,
    key: null,
    parent: null,
    hasNext: false,
    index: 0,
  }
): VJToken<VJTokenType>[] {
  const valType = getObjectType(obj) as VJTokenType;
  if (!isTypeValid(valType)) {
    throwError("Invalid JSON data type: " + valType);
  }

  const { depth, hasNext, key, parent, index } = options;

  if (!["object", "array"].includes(valType)) {
    return [
      {
        type: valType,
        value: obj,
        depth,
        key,
        parent,
        hasNext,
        index,
        hover: false,
      } as VJToken<VJValueTokenType>,
    ];
  } else {
    const isArray = Array.isArray(obj);
    const entries: Array<unknown> = !isArray
      ? Object.entries(obj as unknown[])
      : (obj as Array<unknown>);
    const nextIndex = index + 1;

    let children;
    if (isArray) {
      children = entries
        .reduce((arr: any[], child: any, idx: number) => {
          const lastIndex = arr[arr.length - 1]?.index ?? index;
          arr.push(
            ...parseObject(
              child as VJJSONValue,
              {
                depth: depth + 1,
                hasNext: idx !== entries.length - 1,
                parent: open,
                index: lastIndex + 1,
              } as any
            )
          );
          return arr;
        }, [])
        .flat();
    } else {
      children = (entries as Array<Array<unknown | unknown>>)
        .reduce(
          (
            arr: VJToken<VJTokenType>[],
            [key, value]: Array<unknown | string | number>,
            idx: number
          ) => {
            const lastIndex = arr[arr.length - 1]?.index ?? index;
            arr.push(
              ...parseObject(value as VJJSONValue, {
                depth: depth + 1,
                hasNext: idx !== entries.length - 1,
                key: key as string,
                parent: open,
                index: lastIndex + 1,
              })
            );
            return arr;
          },
          []
        )
        .flat();
    }

    console.log(index, children);
    const lastIndex = children[children.length - 1].index;

    const close = {
      type: valType,
      value: isArray ? "]" : "}",
      role: "close",
      parent,
      depth,
      hasNext,
      index: lastIndex + 1,
      siblingIndex: index,
      childCount: children.length,
    } as VJToken<VJTreeTokenType>;

    const open = {
      type: valType,
      value: isArray ? "[" : "{",
      role: "open",
      parent,
      key,
      depth,
      index,
      hasNext,
      hover: false,
      siblingIndex: close.index,
      childCount: children.length,
    } as VJToken<VJTreeTokenType>;

    return [open, ...children, close];
  }
}
