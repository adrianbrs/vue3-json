export type VJValueParser = (val: string | number) => string;

export interface VJOptions {
  depth: number;
  tabSpaces: number;
  tablines: boolean;
  showQuotes: boolean;
  showLength: boolean;
  valueParser?: VJValueParser;
  collapseBracket?: boolean;
  collapseButton?: boolean;
}
