<template>
  <div class="vj-app">
    <div class="vj-content">
      <component
        v-for="el in elements"
        :key="el.index"
        :is="`vj-${el.type}`"
        :token="el"
        v-show="isVisible(el)"
        v-model:collapsed="el.collapsed"
        @update:collapsed="(collapsed) => updateCollapse(el.index, collapsed)"
      ></component>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, provide, toRefs } from "vue";
import { JSONToken, useParser } from "@/composables/useParser";
import { TokenList } from "@/injection-keys";
import vjBracketVue from "./components/vj-bracket.vue";
import vjStringVue from "./components/vj-string.vue";
import vjKeyVue from "./components/vj-key.vue";

export default defineComponent({
  name: "vue-json",
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  components: {
    "vj-bracket": vjBracketVue,
    "vj-string": vjStringVue,
    "vj-key": vjKeyVue,
  },
  data() {
    return {
      collapsed: false,
    };
  },
  setup(props) {
    const { modelValue } = toRefs(props);

    const elements = useParser(modelValue.value);
    provide(TokenList, elements);

    return {
      elements,
    };
  },
  methods: {
    updateCollapse(index: number, collapsed: boolean) {
      const el = this.elements[index];
      const { depth } = el;

      let next,
        dir = el.role === "open" ? 1 : -1;
      let i = index;
      do {
        i += dir;
        next = this.elements[i];

        if (next.depth === depth) {
          next.collapsed = collapsed;
        } else {
          next.visible = !collapsed;
        }
      } while (i >= 0 && i <= this.elements.length - 1 && next.depth > depth);
    },
    isVisible(el: JSONToken) {
      return typeof el.visible === "undefined" || el.visible;
    },
  },
});
</script>

<style lang="scss">
@import "@/scss/main";
</style>
