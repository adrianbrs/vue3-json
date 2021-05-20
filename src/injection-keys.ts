import { InjectionKey } from "@vue/runtime-core";
import { JSONTokenLoaded } from "./composables/useParser";

export const TokenList: InjectionKey<JSONTokenLoaded[]> = Symbol("TokenList");
