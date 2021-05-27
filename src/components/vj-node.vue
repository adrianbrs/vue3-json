<template>
  <span :class="nodeClasses">
    <vj-tabs :token="token" />

    <span class="vj__key" v-if="showKey">{{ keyText }}&nbsp;</span>

    <span
      :class="valueClasses"
      @click="onClick"
      @mouseenter="onMouseOver"
      @mouseout="onMouseOut"
      v-text="textValue"
    >
    </span>

    <span class="vj__comma" v-if="showComma">,</span>

    <span class="vj__comment" v-if="isCollapsed && showLength"
      >&nbsp;// {{ token.childCount }}</span
    >
  </span>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, toRefs } from "vue";
import { useCollapsable } from "@/composables/useCollapsable";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions, VJValueParser } from "@/types/vue3json";
import { VJToken, VJTokenType, VJTreeTokenType } from "@/types";
import vjTabsVue from "./vj-tabs.vue";
import { isGroupType } from "@/lib/utils";

export default defineComponent({
  name: "vj-bracket",
  components: {
    "vj-tabs": vjTabsVue,
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
        "vj--clickable": this.canCollapse,
        [`vj-${this.tokenRef.type}`]: true,
        [`vj--tree-${this.tokenRef.role}`]: !!this.tokenRef.role,
      };
    },
    textValue(): string {
      if (this.isTree && this.isCollapsed) {
        return `${this.tokenRef.value}...${this.closeToken}`;
      }
      if (this.isString) {
        return `"${this.tokenRef.value}"`;
      }
      return `${this.tokenRef.value}`;
    },
    showKey(): boolean {
      return this.tokenRef.parent?.type !== "array" && !this.isClose;
    },
    showComma(): boolean {
      return this.hasNext && (!this.isTree || this.isClose || this.isCollapsed);
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
    keyText(): string {
      const quote = this.showQuotes ? `"` : "";
      return `${quote}${this.tokenRef.key}${quote}:`;
    },
    isTree(): boolean {
      return isGroupType(this.tokenRef.type);
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
