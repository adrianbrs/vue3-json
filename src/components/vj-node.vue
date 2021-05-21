<template>
  <span
    :class="[nodeClasses, classes]"
    v-if="!isBracket || !isClose || !isCollapsed"
  >
    <vj-tab :token="token" @toggleCollapse="toggleCollapse" />

    <span class="vj-el__content">
      <span class="vj-el__key" v-if="token.key">
        <span class="vj-el__key-block">
          <pre class="vj-el__quotation-mark" v-if="isShowQuotes">"</pre>
          <pre class="vj-el__key-text" v-text="token.key"></pre>
          <pre class="vj-el__quotation-mark" v-if="isShowQuotes">"</pre>
        </span>
        <pre class="vj-el__key-colon">:</pre>
      </span>

      <span class="vj-el__value">
        <span class="vj-el__value-block">
          <pre class="vj-el__quotation-mark" v-if="isString">"</pre>

          <span
            :class="[
              'vj-el__value-text',
              {
                'vj-el--clickable': isBracket,
                hover: this.groupToken && this.groupToken.hover,
              },
            ]"
            @click="onClick"
          >
            <pre @mouseenter="onMouseOver" @mouseout="onMouseOut">{{
              token.value
            }}</pre>

            <template v-if="isBracket && !isClose && isCollapsed && groupToken">
              <pre class="vj-el__ellipsis">...</pre>
              <pre>{{ groupToken.value }}</pre>
            </template>
          </span>

          <pre class="vj-el__quotation-mark" v-if="isString">"</pre>
        </span>

        <pre class="vj-el__value-comma" v-if="hasNext">,</pre>

        <pre
          class="vj-el__comment"
          v-if="isBracket && isCollapsed && isShowLength"
        >
// {{ token.childCount }} items</pre
        >
      </span>
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, toRefs } from "vue";
import { useCollapsable } from "@/composables/useCollapsable";
import { VJToken, VJTokenType } from "@/composables/useParser";
import vjTabVue from "./vj-tab.vue";
import { VJTokenListKey } from "@/injection-keys";

export default defineComponent({
  name: "vj-bracket",
  components: {
    "vj-tab": vjTabVue,
  },
  props: {
    token: {
      type: Object as PropType<VJToken<VJTokenType>>,
      required: true,
    },
    collapsed: {
      type: Boolean,
      default: () => false,
    },
    showLength: {
      type: Boolean,
      default: () => true,
    },
    showQuotes: {
      type: Boolean,
      default: () => true,
    },
  },
  setup(props, context) {
    const tokenList = inject(VJTokenListKey);
    const propsRef = toRefs(props);
    const tokenRef = propsRef.token.value;

    let options = {
      toggleColapse: null,
      classes: [],
    } as Record<string, unknown>;

    if (props.token.type === "bracket") {
      options = useCollapsable(propsRef.collapsed, context);
    }

    return {
      tokenRef,
      tokenList,
      isShowLength: propsRef.showLength,
      isShowQuotes: propsRef.showQuotes,
      toggleCollapse: null,
      classes: [],
      ...options,
    };
  },
  mounted() {
    this.$emit("mounted", this.$el, this.token);
  },
  methods: {
    onClick() {
      if (this.isBracket && this.toggleCollapse) {
        (this.toggleCollapse as unknown as () => void)();

        if (this.isClose) {
          this.onMouseOut();
        }
      }
    },
    onMouseOver() {
      if (this.isBracket && this.tokenRef) {
        this.tokenRef.hover = true;
        if (this.groupToken) {
          this.groupToken.hover = true;
        }
      }
    },
    onMouseOut() {
      if (this.isBracket && this.tokenRef) {
        this.tokenRef.hover = false;
        if (this.groupToken) {
          this.groupToken.hover = false;
        }
      }
    },
  },
  computed: {
    nodeClasses(): Record<string, boolean> {
      return {
        "vj-el": true,
        "vj-el__node": true,
        [`vj-el__${this.token.type}`]: true,
      };
    },
    hasNext(): boolean {
      if (!this.tokenList?.value) return false;
      if (this.token.role === "open") {
        if (this.isCollapsed && this.groupToken) {
          return (
            this.tokenList.value[this.groupToken.index + 1]?.role !== "close" ??
            true
          );
        }
        return false;
      }
      if (this.token.index >= this.tokenList.value.length - 1) return false;
      return (
        this.tokenList.value[this.token.index + 1]?.role !== "close" ?? true
      );
    },
    isBracket(): boolean {
      return this.token.type === "bracket";
    },
    isString(): boolean {
      return this.token.type === "string";
    },
    isClose(): boolean {
      return this.token.role === "close";
    },
    isCollapsed(): boolean {
      return this.token.collapsed ?? false;
    },
    groupToken(): VJToken<"bracket"> | null {
      return this.tokenRef?.groupToken ?? null;
    },
    hoverBlock(): boolean {
      let parent = this.token.parent;
      while (parent) {
        if (parent.hover) return true;
        parent = parent.parent;
      }
      return false;
    },
  },
});
</script>
