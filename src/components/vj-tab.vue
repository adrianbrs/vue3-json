<template>
  <span :class="['vj-el vj-el__tab', { 'vj-el__tab--lines': useTabLines }]">
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
        v-if="token.type === 'bracket' && token.role === 'open'"
        :class="[
          'vj-arrow',
          {
            'vj-arrow--down': !token.collapsed,
            'vj-arrow--right': token.collapsed,
          },
        ]"
      ></span>
    </span>

    <span
      v-for="i in token.depth"
      :key="i"
      :class="[
        'vj-el__tab-space',
        {
          active: i === activeTabLine,
          inner: activeTabLine >= 0 && i > activeTabLine,
        },
      ]"
    ></span>
  </span>
</template>

<script lang="ts">
import { VJToken, VJTokenType } from "@/composables/useParser";
import {
  VJLineNumberWidthKey,
  VJOptionsKey,
  VJTokenListKey,
} from "@/injection-keys";
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
    const propsRef = toRefs(props);
    const { tablines } = toRefs(inject(VJOptionsKey) as VJOptions);

    const tokenList = inject(VJTokenListKey);
    const lineNumberWidth = inject(VJLineNumberWidthKey);

    return {
      useTabLines: tablines,
      tokenList,
      lineNumberWidth,
      tokenRef: propsRef.token,
    };
  },
  computed: {
    activeTabLine(): number {
      let parent = this.token.parent;
      while (parent && !parent.hover) {
        parent = parent.parent;
      }
      return parent && parent.hover ? parent.depth + 1 : 0;
    },
    maxLineNum(): number {
      if (!this.tokenList) return this.token.index;
      return this.tokenList.value.length;
    },
  },
  methods: {
    toggleCollapse() {
      this.$emit("toggleCollapse");
    },
    changeHover(hover: boolean) {
      if (this.tokenRef.type === "bracket") {
        this.tokenRef.hover = hover;
        if (this.tokenRef.groupToken) {
          this.tokenRef.groupToken.hover = hover;
        }
      }
    },
  },
});
</script>
