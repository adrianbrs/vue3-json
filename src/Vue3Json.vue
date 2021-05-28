<template>
  <div style="position: absolute; right: 10%; bottom: 2em"></div>

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
          :selected="this.selection.has(node.token.path)"
          :style="{
            top: useVirtualList ? `${node.top}px` : '',
          }"
          v-model:collapsed="node.token.collapsed"
          @update:collapsed="
            (collapsed) => updateCollapse(node.token.index, collapsed)
          "
          @click="onNodeClick"
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
import {
  VJParserOptions,
  VJToken,
  VJTokenType,
  VJTreeTokenType,
} from "@/types";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions, VJValueParser } from "@/types/vue3json";
import vjNodeVue from "@/components/vj-node.vue";
import { useParser } from "@/composables/useParser";
import { useVirtualList } from "@/composables/useVirtualList";
import { VJVirtualListNode } from "./types/virtualList";
import { isTreeType, isTreeClose, throwError } from "./lib/utils";

// Limited to +/- 124k nodes
export default defineComponent({
  name: "vue-json",
  props: {
    // Path of the selected nodes
    modelValue: {
      type: Array as PropType<string[]>,
      default: null,
    },

    // The json to parse
    json: {
      type: Object,
      required: true,
    },
    depth: {
      type: Number,
      default: 3,
    },
    tablines: {
      type: Boolean,
      default: true,
    },
    hoverable: {
      type: Boolean,
      default: true,
    },
    lineHeight: {
      type: Number,
      default: 18,
    },
    showLength: {
      type: Boolean,
      default: true,
    },
    showQuotes: {
      type: Boolean,
      default: true,
    },
    collapseBracket: {
      type: Boolean,
      default: true,
    },
    collapseButton: {
      type: Boolean,
      default: true,
    },
    valueParser: Function as PropType<VJValueParser>,
    lineNumbers: {
      type: Boolean,
      default: true,
    },
    virtual: {
      type: Boolean,
      default: true,
    },
    tabSpaces: {
      type: Number,
      default: 2,
    },
    preRender: {
      type: Number,
      default: 1,
    },
    path: {
      type: String,
      default: "data",
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
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
      json,
      depth,
      hoverable,
      lineNumbers,
      virtual,
      collapseBracket,
      tablines,
      path,
    } = propsRef;

    if (!json) {
      throwError(`You must specify the "json" attribute.`);
    }

    // Line number max width ref
    const lineNumWidthRef = ref<HTMLElement | null>(null);
    const viewRef = ref<HTMLElement | null>(null);

    const options = reactive({
      depth: depth,
      tablines,
      showQuotes: propsRef.showQuotes,
      showLength: propsRef.showLength,
      valueParser: propsRef.valueParser,
      collapseBracket,
      collapseButton: propsRef.collapseButton,
      tabSpaces: propsRef.tabSpaces,
    } as ToRefs<VJOptions>);

    // Provide plugin props
    provide(VJOptionsKey, options);

    /*******************************************
     *                 PARSER                  *
     *******************************************/
    const parserOptions = computed(
      () =>
        ({
          maxDepth: depth.value,
          path: path.value,
        } as VJParserOptions)
    );
    const elements = computed(() =>
      useParser(json?.value, parserOptions.value)
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
    //     if (isTreeType(token.type)) return;
    //     if (!token.parent) return;

    //   });

    //   return groups;
    // });
    /*******************************************/

    // Non collapsed nodes
    const visibleNodes = computed(() => {
      let visibleList = [];

      for (let i = 0; i < elements.value.length; i++) {
        const node = elements.value[i];
        if (isTreeType(node.type) && node.collapsed) {
          if (isTreeClose(node)) continue;
          visibleList.push(node);
          i = node.siblingIndex as number;
        } else {
          visibleList.push(node);
        }
      }

      return visibleList;
    });

    /*******************************************
     *              VIRTUAL LIST               *
     *******************************************/
    const virtualListAttrs = useVirtualList(visibleNodes, {
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
      useVirtualList: virtual,
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
    selection: {
      get(): Set<string> {
        return new Set(this.modelValue);
      },
      set(value: Set<string>) {
        this.$emit("update:modelValue", Array.from(value));
      },
    },
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
        "vj--collapsable-brackets": this.collapseBracket,
        "vj--tablines": this.tablines,
        "vj--virtual-list": this.useVirtualList,
        "vj--hoverable": this.isHoverable,
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
    onNodeClick(path: string) {
      if (!this.selectable) return;
      if (this.multiple) {
        if (this.selection.has(path)) {
          this.selection.delete(path);
        } else {
          this.selection.add(path);
        }
      } else {
        const add = !this.selection.has(path);
        this.selection.clear();
        if (add) this.selection.add(path);
      }

      this.selection = new Set(this.selection);
    },
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
      if (!isTreeType(el.type)) {
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
      if (!isTreeType(el.type)) return;
      if (isTreeClose(el)) {
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
