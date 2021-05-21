<template>
  <span :class="['vj__tabs', { 'has-lines': tablines }]">
    <!-- <template
      v-if="collapseButton && token.type === 'bracket' && token.role === 'open'"
    >
      <span
        :class="[
          'vj-el__tab-collapse-btn',
          'vj-el--clickable',
          { hover: tokenRef.hover },
        ]"
        @click="toggleCollapse"
        @mouseenter="changeHover(true)"
        @mouseleave="changeHover(false)"
      >
        <span
          :class="[
            'vj-arrow',
            {
              'vj-arrow--down': !token.collapsed,
              'vj-arrow--right': token.collapsed,
            },
          ]"
        ></span>
      </span>
    </template>
    <template v-else>
      <span class="vj-el__tab-collapse-btn"></span>
    </template> -->

    <span
      v-for="i in token.depth"
      :key="i"
      :class="[
        'vj-space',
        {
          active: i === activeTabLine,
        },
      ]"
    >
      <template v-for="i in tabSpaces" :key="i">&nbsp;</template>
    </span>
  </span>
</template>

<script lang="ts">
import { VJToken, VJTokenType } from "@/composables/useParser";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions } from "@/types";
import { defineComponent, inject, PropType, toRefs } from "vue";

export default defineComponent({
  name: "vj-tab",
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
  },
  methods: {
    // toggleCollapse() {
    //   this.$emit("toggleCollapse");
    // },
    // changeHover(hover: boolean) {
    //   if (this.tokenRef.type === "bracket") {
    //     this.tokenRef.hover = hover;
    //     if (this.tokenRef.groupToken) {
    //       this.tokenRef.groupToken.hover = hover;
    //     }
    //   }
    // },
  },
});
</script>
