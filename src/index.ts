import { App } from "@vue/runtime-core";
import Vue3Json from "./Vue3Json.vue";
export * from "@/types/vue3json";

export default {
  ...Vue3Json,
  install(app: App): void {
    app.component(Vue3Json.name, Vue3Json);
  },
};
