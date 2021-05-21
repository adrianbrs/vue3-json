import { InjectionKey, Ref } from "@vue/runtime-core";
import { VJToken, VJTokenType } from "./composables/useParser";
import { VJOptions } from "./types";

export const VJTokenListKey: InjectionKey<VJToken<VJTokenType>[]> =
  Symbol("VueJson_TokenList");

export const VJOptionsKey: InjectionKey<VJOptions> = Symbol("VueJson_Options");
