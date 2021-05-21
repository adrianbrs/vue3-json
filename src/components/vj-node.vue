<template>
  <span
    :class="[
      nodeClasses,
      classes,
      {
        collapsable: canCollapse,
        hover: isHovered,
      },
    ]"
  >
    <vj-tab :token="token" @toggleCollapse="toggleCollapse" />

    <span class="vj__key" v-if="token.key">
      <span class="vj-quote" v-if="showQuotes">"</span>
      <span class="vj-text" v-text="token.key"></span>
      <span class="vj-quote" v-if="showQuotes">"</span>
      <span class="vj-colon">:</span>
    </span>

    <span v-if="token.key" class="vj-space">&nbsp;</span>

    <span :class="['vj__value', `vj-${token.type}`]">
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
      <span class="vj-comma" v-if="hasNext">,</span>

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
import { VJToken, VJTokenType } from "@/composables/useParser";
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
    const tokenRef = propsRef.token.value;

    const tokenList = inject(VJTokenListKey);
    const { showQuotes, showLength, collapseBracket, valueParser } = toRefs(
      inject(VJOptionsKey) as VJOptions
    );

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
      showLength,
      showQuotes,
      valueParser: valueParser as unknown as VJValueParser,
      collapseBracket,
      toggleCollapse: null,
      classes: [],
      ...options,
    };
  },
  mounted() {
    this.$emit("ready", this.$el, this.token);
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
        if (this.groupToken) {
          this.groupToken.hover = true;
        }
      }
    },
    onMouseOut() {
      if (this.canCollapse && this.tokenRef) {
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
        vj__node: true,
        hover: this.tokenRef.hover ?? false,
        [this.tokenRef.type]: true,
        [this.tokenRef.role as string]: !!this.tokenRef.role as boolean,
      };
    },
    hasNext(): boolean {
      if (!this.tokenList) return true;
      if (this.token.role === "open") {
        if (this.isCollapsed && this.groupToken) {
          return (
            this.tokenList[this.groupToken.index + 1]?.role !== "close" ?? true
          );
        }
        return false;
      }
      if (this.token.index >= this.tokenList.length - 1) return false;
      return this.tokenList[this.token.index + 1]?.role !== "close" ?? true;
    },
    isBracket(): boolean {
      return this.tokenRef.type === "bracket";
    },
    isString(): boolean {
      return this.tokenRef.type === "string";
    },
    isClose(): boolean {
      return this.tokenRef.role === "close";
    },
    isCollapsed(): boolean {
      return (
        this.tokenRef.type === "bracket" && (this.tokenRef.collapsed ?? false)
      );
    },
    groupToken(): VJToken<"bracket"> | null {
      return this.tokenRef?.groupToken ?? null;
    },
    canCollapse(): boolean {
      return this.tokenRef?.type === "bracket" && !!this.collapseBracket;
    },
    isHovered(): boolean {
      return !!this.tokenRef?.hover || !!this.groupToken?.hover;
    },
    closeToken(): string {
      return this.tokenRef.value === "["
        ? "]"
        : this.tokenRef.value === "{"
        ? "}"
        : "";
    },
  },
});
</script>
