<template>
  <br v-if="inArray" />
  <span class="vj-el vj-el__string">
    <span class="vj-el--flex">
      <vj-tab :token="token" v-if="inArray" />

      <span class="vj-el__token">
        <span class="vj-el vj-el__quotation-mark">"</span>
        <span class="vj-el vj-el__string-text" v-text="token.value"></span>
        <span class="vj-el vj-el__quotation-mark">"</span>
      </span>

      <span class="vj-el vj-el__comma" v-if="hasComma">,</span>
    </span>
  </span>
  <br />
</template>

<script lang="ts">
import { JSONTokenLoaded } from "@/composables/useParser";
import { TokenList } from "@/injection-keys";
import { defineComponent, inject, PropType } from "vue";
import vjTabVue from "./vj-tab.vue";

export default defineComponent({
  name: "vj-bracket",
  components: {
    "vj-tab": vjTabVue,
  },
  props: {
    token: {
      type: Object as PropType<JSONTokenLoaded>,
      required: true,
    },
  },
  setup() {
    const tokenList = inject(TokenList);
    return { tokenList };
  },
  computed: {
    hasComma(): boolean {
      if (!this.tokenList) return true;
      const index = this.token.index;
      const next = this.tokenList[index + 1];
      return next.role !== "close";
    },
    inArray(): boolean {
      return this.token.context === "array";
    },
  },
});
</script>
