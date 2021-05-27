<template>
  <span
    v-for="i in token.depth"
    :key="i"
    :class="{ vj__tab: true, active: i === activeTabLine }"
    v-html="spaceText"
  ></span>
</template>

<script lang="ts">
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions } from "@/types/vue3json";
import { defineComponent, inject, PropType, toRefs } from "vue";
import { VJToken, VJTokenType } from "@/types";

export default defineComponent({
  name: "vj-tabs",
  props: {
    token: {
      type: Object as PropType<VJToken<VJTokenType>>,
      required: true,
    },
  },
  setup(props) {
    const { token: tokenRef } = toRefs(props);
    const { tablines, tabSpaces } = toRefs(inject(VJOptionsKey) as VJOptions);

    const tokenList = inject(VJTokenListKey);

    return {
      tablines,
      tokenList,
      tokenRef,
      tabSpaces,
    };
  },
  computed: {
    activeTabLine(): number {
      let parent = this.tokenRef.parent;
      while (parent && !parent.hover) {
        parent = parent.parent;
      }
      return parent && parent.hover ? parent.depth + 1 : 0;
    },
    spaceText(): string {
      return "&nbsp;".repeat(Math.max(+this.tabSpaces, 1));
    },
  },
});
</script>
