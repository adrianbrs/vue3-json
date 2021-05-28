import { reactive } from "@vue/reactivity";
import { isTreeType, throwError } from "@/lib/utils";
import {
  VJJSONLiteral,
  VJJSONValue,
  VJParserOptions,
  VJToken,
  VJTokenType,
  VJTreeTokenType,
  VJValueTokenType,
  VJ_VALID_TOKEN_TYPES,
} from "@/types";

interface ParserIterationOptions {
  depth: number;
  parent: VJToken<VJTokenType> | null;
  key: string | number | null;
  hasNext: boolean;
  index: number;
  maxDepth: number;
  path: string;
}

export function useParser(val: VJJSONValue, options: VJParserOptions) {
  return reactive(
    parseObject(val, {
      maxDepth: options.maxDepth,
      path: options.path,
    })
  );
}

function getObjectType(obj: unknown) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

function isTypeValid(type: string) {
  return VJ_VALID_TOKEN_TYPES.includes(type as VJTokenType);
}

function createToken<T extends VJTokenType>(
  token: Partial<VJToken<T>>
): VJToken<T> {
  return Object.assign(
    {
      type: null,
      value: null,
      depth: 0,
      key: null,
      parent: null,
      hasNext: false,
      index: -1,
      hover: false,
      childCount: -1,
      role: null,
      path: "",
      siblingIndex: -1,
      collapsed: false,
    } as unknown as VJToken<T>,
    token
  );
}

function parseObject(
  obj: VJJSONValue,
  itOptions?: Partial<ParserIterationOptions>
): VJToken<VJTokenType>[] {
  const valType = getObjectType(obj) as VJTokenType;
  if (!isTypeValid(valType)) {
    throwError("Invalid JSON data type: " + valType);
  }
  const options: ParserIterationOptions = Object.assign(
    {
      depth: 0,
      key: null,
      parent: null,
      hasNext: false,
      index: 0,
      maxDepth: -1,
      path: "",
    },
    itOptions
  );

  const { depth, maxDepth, hasNext, key, parent, index, path } = options;
  const hasMaxDepth = maxDepth >= 0;

  if (!isTreeType(valType)) {
    return [
      createToken<VJValueTokenType>({
        type: valType as VJValueTokenType,
        value: obj as VJJSONLiteral,
        depth,
        key,
        parent,
        hasNext,
        index,
        path,
      }),
    ];
  } else {
    const isArray = Array.isArray(obj);
    const entries: VJJSONValue[] | Array<[string, VJJSONValue]> = !isArray
      ? Object.entries(obj as Record<string, VJJSONValue>)
      : (obj as Array<VJJSONValue>);

    const open = createToken<VJTreeTokenType>({
      type: valType as VJTreeTokenType,
      value: isArray ? "[" : "{",
      treeRole: 0,
      parent,
      key,
      depth,
      index,
      hasNext,
      childCount: entries.length,
      collapsed: hasMaxDepth && depth >= maxDepth,
      path,
    });

    let children;
    if (isArray) {
      children = (entries as VJJSONValue[])
        .reduce((arr, child, idx: number) => {
          const lastIndex = arr[arr.length - 1]?.index ?? index;
          arr.push(
            ...parseObject(child as VJJSONValue, {
              depth: depth + 1,
              key: idx,
              hasNext: idx !== entries.length - 1,
              parent: open,
              index: lastIndex + 1,
              maxDepth,
              path: `${path}[${idx}]`,
            })
          );
          return arr;
        }, [] as VJToken<VJTokenType>[])
        .flat();
    } else {
      children = (entries as Array<[string, VJJSONValue]>)
        .reduce((arr, [key, value], idx) => {
          const lastIndex = arr[arr.length - 1]?.index ?? index;
          arr.push(
            ...parseObject(value, {
              depth: depth + 1,
              hasNext: idx !== entries.length - 1,
              key: key,
              parent: open,
              index: lastIndex + 1,
              maxDepth,
              path: `${path}.${key}`,
            })
          );
          return arr;
        }, [] as VJToken<VJTokenType>[])
        .flat();
    }

    const lastIndex =
      children[children.length - 1]?.index ?? index + children.length;

    const close = createToken<VJTreeTokenType>({
      type: valType as VJTreeTokenType,
      value: isArray ? "]" : "}",
      treeRole: 1,
      key,
      parent,
      depth,
      hasNext,
      index: lastIndex + 1,
      siblingIndex: index,
      childCount: entries.length,
      collapsed: open.collapsed,
      path,
    });

    // Sets open token siblingIndex
    open.siblingIndex = close.index;

    return [open, ...children, close];
  }
}
