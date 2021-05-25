<template>
  <span :class="nodeClasses">
    <vj-tab :token="token" @toggleCollapse="toggleCollapse" />

    <span class="vj__key" v-if="token.key">
      <span class="vj-quote" v-if="showQuotes">"</span>
      <span class="vj-text" v-text="token.key"></span>
      <span class="vj-quote" v-if="showQuotes">"</span>
      <span class="vj-colon">:</span>
    </span>

    <span v-if="token.key" class="vj-space">&nbsp;</span>

    <span :class="valueClasses">
      <span class="vj-quote" v-if="isString">"</span>

      <!-- Clickable Bracket -->
      <span
        :class="[
          'vj-text',
          {
            'vj--clickable': canCollapse,
          },
        ]"
        @click="onClick"
      >
        <span
          class="vj-token"
          @mouseenter="onMouseOver"
          @mouseout="onMouseOut"
          v-text="token.value"
        ></span>

        <template v-if="isCollapsed && !isClose">
          <span class="vj-ellipsis">...</span>
          <span class="vj-token">{{ closeToken }}</span>
        </template>
      </span>
      <!-- / Clickable Bracket -->

      <span class="vj-quote" v-if="isString">"</span>
      <span class="vj-comma" v-if="hasNext && (isClose || isCollapsed)">,</span>

      <!-- Show length -->
      <span class="vj-comment" v-if="isCollapsed && showLength"
        >&nbsp;// {{ token.childCount }} items</span
      >
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, toRefs } from "vue";
import { useCollapsable } from "@/composables/useCollapsable";
import { VJToken, VJTokenType, VJTreeTokenType } from "@/composables/useParser";
import vjTabVue from "./vj-tab.vue";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions, VJValueParser } from "@/types";

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
  },
  setup(props, context) {
    const propsRef = toRefs(props);
    const tokenRef = propsRef.token;

    const tokenList = inject(VJTokenListKey);
    const { showQuotes, showLength, collapseBracket, valueParser } = toRefs(
      inject(VJOptionsKey) as VJOptions
    );

    return {
      tokenRef,
      tokenList,
      showLength,
      showQuotes,
      valueParser: valueParser as unknown as VJValueParser,
      collapseBracket,
      isCollapsed: propsRef.collapsed,
      ...useCollapsable(propsRef.collapsed, context),
    };
  },
  mounted() {
    this.$emit("ready", this.$el?.clientHeight, this.token.index);
  },
  methods: {
    onClick() {
      if (this.canCollapse && this.toggleCollapse) {
        (this.toggleCollapse as unknown as () => void)();

        // Remove hover if clicked on a close bracket
        if (this.isClose) {
          this.onMouseOut();
        }
      }
    },
    onMouseOver() {
      if (this.canCollapse && this.tokenRef) {
        this.tokenRef.hover = true;
        if (this.sibling) {
          this.sibling.hover = true;
        }
      }
    },
    onMouseOut() {
      if (this.canCollapse && this.tokenRef) {
        this.tokenRef.hover = false;
        if (this.sibling) {
          this.sibling.hover = false;
        }
      }
    },
  },
  computed: {
    nodeClasses(): Record<string, boolean> {
      return {
        vj__node: true,
        "vj--hover": !!this.tokenRef.hover,
        "vj--collapsed": this.isCollapsed,
      };
    },
    valueClasses(): Record<string, boolean> {
      return {
        vj__value: true,
        [`vj-${this.tokenRef.type}`]: true,
        [`vj-${this.tokenRef.role}`]: !!this.tokenRef.role,
      };
    },
    hasNext(): boolean {
      return this.tokenRef?.hasNext ?? true;
    },
    sibling(): VJToken<VJTreeTokenType> | null {
      if (!this.tokenList || !this.isTree) return null;
      return this.tokenList[
        (this.tokenRef as VJToken<VJTreeTokenType>).siblingIndex
      ] as VJToken<VJTreeTokenType>;
    },
    isTree(): boolean {
      return ["object", "array"].includes(this.tokenRef.type);
    },
    isString(): boolean {
      return this.tokenRef.type === "string";
    },
    isClose(): boolean {
      return this.tokenRef.role === "close";
    },
    canCollapse(): boolean {
      return this.isTree && !!this.collapseBracket;
    },
    isHovered(): boolean {
      return !!this.tokenRef?.hover || !!this.sibling?.hover;
    },
    closeToken(): string {
      if (!this.tokenList) return "";
      return (
        (this.tokenList[this.tokenRef.siblingIndex as number]
          ?.value as string) ?? ""
      );
    },
  },
});
</script>
