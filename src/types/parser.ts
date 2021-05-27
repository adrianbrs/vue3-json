export const VJ_VALID_TOKEN_TYPES = [
  "array",
  "object",
  "string",
  "number",
  "boolean",
  "null",
] as const;

export type VJTokenType = typeof VJ_VALID_TOKEN_TYPES[number];
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
  key: string | number | null;
  value: VJJSONLiteral;
  depth: number;
  parent: VJToken<VJTokenType> | null;
  collapsed?: boolean;
  index: number;
  path: string;
  hover: boolean;
  hasNext: boolean;
  role: T extends VJTreeTokenType ? "open" | "close" : undefined;
  siblingIndex: T extends VJTreeTokenType ? number : undefined;
  childCount: T extends VJTreeTokenType ? number : undefined;
}

export interface VJParserOptions {
  maxDepth: number;
  path: string;
}
