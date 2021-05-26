import { Ref } from "vue";
import { VJToken, VJTokenType } from "./parser";

export interface VJVirtualListOptions {
  lineHeight: Ref<number>;
  viewRef: Ref<HTMLElement | null>;
  preRender?: Ref<number>;
}

export interface VJVirtualListScroll {
  height: number;
  top: number;
  bottom: number;
}

export interface VJVirtualListView {
  height: number;
  width: number;
}

export interface VJVirtualListNode {
  token: VJToken<VJTokenType>;
  index: number;
  height: number;
  bottom: number;
  top: number;
}
