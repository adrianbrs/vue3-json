<template>
  <div style="position: absolute; left: 100%; bottom: 1em"></div>

  <div class="vj-app" v-bind="$attrs">
    <div ref="viewContent" :class="windowClasses">
      <div class="vj__view" :style="viewStyle">
        <!-- <vj-node
          v-if="updatingViewWidth"
          class="vj--hidden"
          :token="nodeLongestLine"
          :ref="setViewWidth"
        ></vj-node> -->

        <vj-node
          v-for="node in nodesToRender"
          :key="node.token.index"
          :token="node.token"
          :style="{
            top: useVirtualList ? `${node.top}px` : '',
          }"
          v-model:collapsed="node.token.collapsed"
          @update:collapsed="
            (collapsed) => updateCollapse(node.token.index, collapsed)
          "
        ></vj-node>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ComponentPublicInstance,
  computed,
  defineComponent,
  PropType,
  provide,
  reactive,
  ref,
  ToRefs,
  toRefs,
} from "vue";
import { VJToken, VJTokenType, VJTreeTokenType } from "@/types";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions, VJValueParser } from "@/types/vue3json";
import vjNodeVue from "@/components/vj-node.vue";
import { useParser } from "@/composables/useParser";
import { useVirtualList } from "@/composables/useVirtualList";
import { VJVirtualListNode } from "./types/virtualList";
import { findTokenIndex, getTokenWidth } from "./lib/utils";

export default defineComponent({
  name: "vue-json",
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    depth: {
      type: Number,
      default: () => 3,
    },
    tablines: {
      type: Boolean,
      default: () => true,
    },
    hoverable: {
      type: Boolean,
      default: () => true,
    },
    lineHeight: {
      type: Number,
      default: () => 18,
    },
    showLength: {
      type: Boolean,
      default: () => true,
    },
    showQuotes: {
      type: Boolean,
      default: () => true,
    },
    collapseBracket: {
      type: Boolean,
      default: () => true,
    },
    collapseButton: {
      type: Boolean,
      default: () => true,
    },
    valueParser: Function as PropType<VJValueParser>,
    lineNumbers: {
      type: Boolean,
      default: () => true,
    },
    virtualList: {
      type: Boolean,
      default: () => false,
    },
    tabSpaces: {
      type: Number,
      default: () => 2,
    },
    preRender: {
      type: Number,
      default: () => 3,
    },
  },
  components: {
    "vj-node": vjNodeVue,
  },
  data() {
    return {
      lineNumWidth: 0,
      viewWidth: 0,
      updatingViewWidth: true,
    };
  },
  setup(props) {
    const propsRef = toRefs(props);

    const viewContent = ref(null as HTMLElement | null);
    const {
      modelValue,
      depth,
      hoverable,
      lineNumbers,
      virtualList,
      collapseBracket: canBracketCollapse,
      tablines: hasTablines,
    } = propsRef;

    // Line number max width ref
    const lineNumWidthRef = ref<HTMLElement | null>(null);
    const viewRef = ref<HTMLElement | null>(null);

    const options = reactive({
      depth: depth,
      tablines: hasTablines,
      showQuotes: propsRef.showQuotes,
      showLength: propsRef.showLength,
      valueParser: propsRef.valueParser,
      collapseBracket: canBracketCollapse,
      collapseButton: propsRef.collapseButton,
      tabSpaces: propsRef.tabSpaces,
    } as ToRefs<VJOptions>);

    // Provide plugin props
    provide(VJOptionsKey, options);

    /*******************************************
     *                 PARSER                  *
     *******************************************/
    const parserOptions = computed(() => ({
      maxDepth: depth.value,
    }));
    const elements = computed(() =>
      useParser(modelValue.value, parserOptions.value)
    );
    provide(VJTokenListKey, elements as unknown as VJToken<VJTokenType>[]);
    /*******************************************/

    /*******************************************
     *               VIEW WIDTH                *
     *******************************************/
    // const tokenGroupsByWidth = computed(() => {
    //   const tokensByWidth = elements.value.slice().sort((tk1, tk2) => getTokenWidth(tk2) - getTokenWidth(tk1));
    //   const groups = ref([] as VJToken<VJTokenType>[]);
    //   console.log("tokenByWidth:", tokensByWidth);

    //   tokensByWidth.forEach((token) => {
    //     if (isGroupType(token.type)) return;
    //     if (!token.parent) return;

    //   });

    //   return groups;
    // });
    /*******************************************/

    // Non collapsed nodes
    const visibleNodes = computed(() => {
      let visibleList = elements.value.slice();

      // Remove collapsed nodes
      visibleList.forEach((node) => {
        if (
          node.collapsed &&
          node.role === "open" &&
          typeof node.siblingIndex !== "undefined"
        ) {
          // Remove collapsed peace
          const startIdx = findTokenIndex(visibleList, node);
          const endIdx = findTokenIndex(
            visibleList,
            elements.value[node.siblingIndex]
          );

          const firstPiece = visibleList.slice(0, startIdx + 1);
          const lastPiece = visibleList.slice(endIdx + 1);

          // Change visible list
          visibleList = firstPiece.concat(lastPiece);
        }
      });

      return visibleList;
    });

    /*******************************************
     *              VIRTUAL LIST               *
     *******************************************/
    const virtualListAttrs = useVirtualList(elements, visibleNodes, {
      lineHeight: propsRef.lineHeight,
      preRender: propsRef.preRender,
      viewRef: viewContent,
    });
    /******************************************/

    return {
      viewContent,
      elements,
      isHoverable: hoverable,
      showLineNumbers: lineNumbers,
      lineNumWidthRef,
      viewRef,
      useVirtualList: virtualList,
      canBracketCollapse,
      hasTablines,
      visibleNodes,
      // tokensByWidth,
      ...virtualListAttrs,
    };
  },
  mounted() {
    if (!this.viewContent) return;
    this.updateLineNumWidth();

    if (this.useVirtualList) {
      this.startVirtualList();
    }
  },
  watch: {
    useVirtualList(use: boolean) {
      if (use) {
        this.startVirtualList();
      } else {
        this.stopVirtualList();
      }
    },
    visibleNodes() {
      // this.updateViewWidth();
    },
  },
  computed: {
    // nodeLongestLine(): VJToken<VJTokenType> {
    //   const res = this.visibleNodes.reduce((longest, node) => {
    //     if (getTokenWidth(node) > getTokenWidth(longest)) {
    //       return node;
    //     }
    //     return longest;
    //   }, this.visibleNodes[0]);

    //   console.log("nodeLongestLine:", this.visibleNodes.length);

    //   return res;
    // },
    nodesToRender(): VJVirtualListNode[] {
      if (this.useVirtualList) return this.vlViewableNodes;
      return this.visibleNodes.map((el) => ({
        token: el,
        index: el.index,
        height: 0,
        bottom: 0,
        top: 0,
      }));
    },
    lineNumberElements(): number[] {
      return [];
      // return this.vlNodeList.map((el) => el.index);
    },
    windowClasses(): Record<string, boolean | unknown> {
      return {
        vj__window: true,
        "vj--collapsable-brackets": this.canBracketCollapse,
        "vj--tablines": this.hasTablines,
        "vj--virtual-list": this.useVirtualList,
      };
    },
    nodeStyles(): Record<string, string> {
      return {
        height: `${this.lineHeight}px`,
      };
    },
    viewStyle(): Record<string, string> {
      if (!this.useVirtualList) return {};

      return {
        height: `${this.vlScroll.height}px`,
        minWidth: `${this.viewWidth}px`,
        lineHeight: `${this.lineHeight}px`,
      };
    },
  },
  methods: {
    updateViewWidth() {
      this.updatingViewWidth = true;
    },
    setViewWidth(node: ComponentPublicInstance) {
      if (node && node.$el) {
        const $el = node.$el as HTMLElement;
        if ($el.clientWidth) this.viewWidth = $el.clientWidth;
      }

      // Remove node on next tick
      this.$nextTick(() => {
        this.updatingViewWidth = false;
      });
    },
    updateLineNumWidth() {
      // Get max line number width
      if (this.lineNumWidthRef && this.lineNumWidthRef.offsetWidth) {
        const width = this.lineNumWidthRef.offsetWidth;
        this.lineNumWidth = width;
      }
    },
    isCollapsed(el: VJToken<VJTokenType> | null): boolean {
      if (!el) return false;
      if (!["array", "object"].includes(el.type)) {
        return this.isCollapsed(el.parent);
      }
      const tree = el as VJToken<VJTreeTokenType>;
      const sibling = this.elements[
        tree.siblingIndex
      ] as VJToken<VJTreeTokenType>;

      if (tree.collapsed || sibling.collapsed) return true;

      return this.isCollapsed(tree.parent);
    },
    updateCollapse(index: number, collapsed: boolean): void {
      const el = this.elements[index] as VJToken<VJTreeTokenType>;
      if (!["array", "object"].includes(el.type)) return;
      if (el.role === "close") {
        return this.updateCollapse(el.siblingIndex, collapsed);
      }
      const sibling = this.elements[
        el.siblingIndex
      ] as VJToken<VJTreeTokenType>;

      // Collapse tokens
      el.collapsed = collapsed;
      sibling.collapsed = collapsed;
    },
  },
});
</script>

<style lang="scss">
@import "@/scss/main";
</style>
