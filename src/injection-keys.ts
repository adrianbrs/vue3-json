import { InjectionKey } from "@vue/runtime-core";
import { VJOptions, VJToken, VJTokenType } from "@/types";

export const VJTokenListKey: InjectionKey<VJToken<VJTokenType>[]> =
  Symbol("VueJson_TokenList");

export const VJOptionsKey: InjectionKey<VJOptions> = Symbol("VueJson_Options");
