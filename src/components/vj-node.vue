<template>
  <span :class="nodeClasses" @click="onNodeClick">
    <vj-tabs :token="token" />

    <span class="vj__key" v-if="showKey">{{ keyText }}&nbsp;</span>

    <span
      :class="valueClasses"
      @click="onBracketClick"
      @mouseenter="onBracketMouseEnter"
      @mouseout="onBracketMouseLeave"
      v-text="textValue"
    >
    </span>

    <span class="vj__comma" v-if="showComma">,</span>

    <span class="vj__comment" v-if="collapsed && showLength"
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
import { isTreeClose, isTreeType } from "@/lib/utils";
import vjTabsVue from "./vj-tabs.vue";

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
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click", "update:collapsed"],
  setup(props, context) {
    const propsRef = toRefs(props);
    const tokenRef = propsRef.token;
    const { collapsed } = propsRef;

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
      ...useCollapsable(collapsed, context.emit),
    };
  },
  methods: {
    onBracketClick(e: MouseEvent) {
      if (this.canCollapse && this.toggleCollapse) {
        e.stopPropagation();
        (this.toggleCollapse as unknown as () => void)();

        // Remove hover if clicked on a close bracket
        if (this.isClose) {
          this.onBracketMouseLeave();
        }
      }
    },
    onBracketMouseEnter() {
      if (this.canCollapse && this.tokenRef) {
        this.tokenRef.hover = true;
        if (this.sibling) {
          this.sibling.hover = true;
        }
      }
    },
    onBracketMouseLeave() {
      if (this.canCollapse && this.tokenRef) {
        this.tokenRef.hover = false;
        if (this.sibling) {
          this.sibling.hover = false;
        }
      }
    },
    onNodeClick() {
      this.$emit("click", this.tokenPath);
    },
  },
  computed: {
    nodeClasses(): Record<string, boolean> {
      return {
        vj__node: true,
        "vj--hover": !!this.tokenRef.hover,
        "vj--collapsed": this.collapsed,
        "vj--selected": this.selected,
      };
    },
    valueClasses(): Record<string, boolean> {
      return {
        vj__value: true,
        "vj--clickable": this.canCollapse,
        [`vj-${this.tokenRef.type}`]: true,
      };
    },
    textValue(): string {
      if (this.isTree && this.collapsed) {
        return `${this.tokenRef.value}...${this.closeToken}`;
      }
      if (this.isString) {
        return `"${this.tokenRef.value}"`;
      }
      return `${this.tokenRef.value}`;
    },
    tokenPath(): string {
      return this.tokenRef.path;
    },
    showKey(): boolean {
      return (
        this.tokenRef.parent?.type !== "array" &&
        !this.isClose &&
        this.tokenRef.key !== null
      );
    },
    showComma(): boolean {
      return this.hasNext && (!this.isTree || this.isClose || this.collapsed);
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
      return isTreeType(this.tokenRef.type);
    },
    isString(): boolean {
      return this.tokenRef.type === "string";
    },
    isClose(): boolean {
      return isTreeClose(this.tokenRef);
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
