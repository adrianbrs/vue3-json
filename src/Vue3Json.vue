<template>
  <div class="vj-app">
    <div ref="viewContent" :class="windowClasses">
      <div class="vj-content__line-numbers" v-if="false">
        <span
          class="vj-el__line-number"
          v-for="line in lineNumberElements"
          :key="line"
          :style="{
            ...viewContentStyle,
            width: `${lineNumWidth}px`,
            flex: `0 0 ${getElementHeight(line)}px`,
          }"
        >
          <pre>{{ line }}</pre>
        </span>

        <!-- Helper element to get max line number width -->
        <span class="vj-helper">
          <span class="vj-helper__el">
            <pre ref="lineNumWidthRef" class="vj-el__line-number">{{
              elements[elements.length - 1].index
            }}</pre>
          </span>
        </span>
      </div>

      <div class="vj__view" :style="viewStyle">
        <div class="vj__view-content" :style="viewContentStyle">
          <vj-node
            v-for="el in renderElements"
            :key="el.index"
            :token="el"
            :style="nodeStyles"
            v-model:collapsed="el.collapsed"
            @update:collapsed="
              (collapsed) => updateCollapse(el.index, collapsed)
            "
            @ready="onElementReady"
          ></vj-node>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  PropType,
  provide,
  reactive,
  ref,
  ToRefs,
  toRefs,
  watch,
} from "vue";
import {
  VJToken,
  useParser,
  VJTokenType,
  VJTreeTokenType,
} from "@/composables/useParser";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import { VJOptions, VJValueParser } from "@/types";
import ResizeObserver from "resize-observer-polyfill";
import vjNodeVue from "@/components/vj-node.vue";

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
      default: () => 17,
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
    singleLine: {
      type: Boolean,
      default: () => true,
    },
  },
  components: {
    "vj-node": vjNodeVue,
  },
  data() {
    return {
      scroll: {
        top: 0,
        height: 0,
        end: 0,
      },
      view: {
        height: 0,
        width: 0,
      },
      resizeObserver: null as ResizeObserver | null,
      updatingView: false,
      updatingTree: false,
      startEntry: 0,
      endEntry: 0,
      prerender: 1,
      heightList: [] as number[],
      lineNumWidth: 0,
      loadedNodes: new Set() as Set<number>,
    };
  },
  setup(props) {
    const propsRef = toRefs(props);
    const {
      modelValue,
      depth,
      hoverable,
      lineNumbers,
      virtualList,
      collapseBracket: canBracketCollapse,
      tablines: hasTablines,
      singleLine: isSingleLine,
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
      singleLine: propsRef.singleLine,
    } as ToRefs<VJOptions>);

    // Provide plugin props
    provide(VJOptionsKey, options);

    const parserOptions = computed(() => ({
      maxDepth: depth.value,
    }));

    const elements = ref(useParser(modelValue.value, parserOptions.value));
    provide(VJTokenListKey, elements as unknown as VJToken<VJTokenType>[]);

    // Watch model value
    watch(modelValue, (val) => {
      nextTick(() => {
        elements.value = useParser(val, parserOptions.value);
      });
    });

    // Watch parser options change
    watch(parserOptions, (opts) => {
      nextTick(() => {
        elements.value = useParser(modelValue.value, opts);
      });
    });

    // Content View
    const viewContent = ref<HTMLDivElement | null>(null);

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
      isSingleLine,
    };
  },
  created() {
    this.elements.forEach(() => {
      this.heightList.push(this.lineHeight);
    });
  },
  mounted() {
    if (!this.viewContent) return;
    this.updateViewSize();
    this.updateLineNumWidth();

    if (this.useVirtualList) {
      this.startVirtualList();
    }
  },
  computed: {
    visibleElements(): {
      token: VJToken<VJTokenType>;
      index: number;
      height: number;
      bottom: number;
      top: number;
    }[] {
      const els =
        this.elements
          .filter((el: VJToken<VJTokenType>) => el.visible)
          .reduce(
            (arr, token, i) => {
              const height =
                this.getElementHeight(token.index) ?? this.lineHeight;
              arr.push({
                token,
                index: i,
                height,
                bottom: height + (arr[i - 1] ? arr[i - 1].bottom : 0),
                top: arr[i - 1] ? arr[i - 1].bottom : 0,
              });

              return arr;
            },
            [] as {
              token: VJToken<VJTokenType>;
              index: number;
              height: number;
              bottom: number;
              top: number;
            }[]
          ) ?? [];

      return els;
    },
    renderElements(): VJToken<VJTokenType>[] {
      let elements = this.visibleElements;

      // Splice for virtual list
      if (this.useVirtualList) {
        elements = elements.slice(this.startEntry, this.endEntry);
      }
      return elements.map((v) => v.token);
    },
    lineNumberElements(): number[] {
      return this.renderElements.map((el) => el.index);
    },
    windowClasses(): Record<string, boolean | unknown> {
      return {
        vj__window: true,
        "vj--collapsable-brackets": this.canBracketCollapse,
        "vj--tablines": this.hasTablines,
        "vj--single-line": this.isSingleLine,
      };
    },
    nodeStyles(): Record<string, string> {
      return {
        height: this.isSingleLine ? `${this.lineHeight}px` : "",
      };
    },
    viewContentStyle(): Record<string, string> {
      if (!this.useVirtualList) return {};
      const startIndex = this.startEntry ?? 0;
      const top = this.visibleElements[startIndex]?.top ?? 0;

      return {
        transform: `translateY(${top}px)`,
      };
    },
    viewStyle(): Record<string, string> {
      if (!this.useVirtualList) return {};

      return {
        height: `${this.scroll.height}px`,
      };
    },
  },
  watch: {
    visibleElements() {
      this.$nextTick(() => {
        this.updateView();
      });
    },
    useVirtualList(use: boolean) {
      if (use) {
        this.startVirtualList();
      } else {
        this.stopVirtualList();
      }
    },
    isSingleLine() {
      this.updateTree();
    },
  },
  methods: {
    startVirtualList() {
      if (!this.viewContent) return;

      // Listen to view scroll
      this.viewContent.addEventListener("scroll", this.updateView);

      // Create view resize observer
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(this.onViewResize);
      }
      this.resizeObserver.observe(this.viewContent);

      this.$nextTick(() => {
        this.updateView();
      });
    },
    stopVirtualList() {
      if (!this.viewContent) return;

      // Remove listener and observer
      this.viewContent.removeEventListener("scroll", this.updateView);
      this.resizeObserver?.unobserve(this.viewContent);
    },
    // Force tree nodes update
    updateTree(resetLoaded = false) {
      if (!this.updatingTree) {
        this.updatingTree = true;

        requestAnimationFrame(() => {
          if (resetLoaded) {
            this.loadedNodes.clear();
          }
          const elements = this.elements.slice();
          this.elements = [];

          this.$nextTick(() => {
            this.updatingTree = false;

            this.elements = elements;
            this.updateView();
          });
        });
      }
    },
    getElementHeight(index: number) {
      return this.isSingleLine ? this.lineHeight : this.heightList[index];
    },
    onViewResize(entries: ResizeObserverEntry[]) {
      if (!this.useVirtualList) return;
      const entry = entries[0];

      if (entry) {
        this.updateTree(true);
      }
    },
    updateLineNumWidth() {
      // Get max line number width
      if (this.lineNumWidthRef && this.lineNumWidthRef.offsetWidth) {
        const width = this.lineNumWidthRef.offsetWidth;
        this.lineNumWidth = width;
      }
    },
    updateView() {
      if (!this.useVirtualList) return;

      // Update view only after each animation frame
      if (!this.updatingView) {
        this.updatingView = true;
        requestAnimationFrame(() => {
          this.updatingView = false;

          // Update view size again to calculate scroll bottom
          this.updateViewSize();
          this.updateEntries();
        });
      }
    },
    updateViewSize() {
      if (!this.viewContent) return;
      const { clientHeight, clientWidth, scrollTop, scrollHeight } =
        this.viewContent;

      this.scroll = {
        top: scrollTop,
        height: this.visibleElements
          ? this.visibleElements[this.visibleElements.length - 1]?.bottom
          : scrollHeight,
        end: scrollTop + clientHeight,
      };

      this.view = {
        height: clientHeight,
        width: clientWidth,
      };
    },
    onElementReady(height: number, index: number) {
      if (this.isSingleLine || this.loadedNodes.has(index)) return;
      if (typeof height !== "undefined") {
        if (height !== this.getElementHeight(index)) {
          this.heightList[index] = height;
        }
        this.loadedNodes.add(index);
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

      if (sibling.role === "close") {
        sibling.visible = !collapsed;
      }

      // Toggle children
      for (let i = index + 1; i <= sibling.index; i++) {
        const child = this.elements[i];
        child.visible = !collapsed;

        if (child.collapsed && child.role === "open") {
          i = child.siblingIndex as number;
        }
      }
    },
    updateEntries() {
      this.startEntry = this.binEntrySearch();

      // Find end entry
      const count = this.visibleElements.length;

      let minPossibleEnd =
        this.startEntry + ~~(this.view.height / this.lineHeight);
      let endIdx;
      for (endIdx = minPossibleEnd; endIdx < count; endIdx++) {
        const bottom = this.visibleElements[endIdx].bottom;
        if (bottom > this.scroll.end) {
          break;
        }
      }

      endIdx = Math.min(endIdx + 1, count);
      this.endEntry = Math.max(endIdx, 1);
    },
    binEntrySearch() {
      const count = this.visibleElements.length;

      let start = 0;
      let end = count;
      let i = ~~(count / 2);
      let oldI, el;

      do {
        oldI = i;
        el = this.visibleElements[i];

        if (el.bottom < this.scroll.top) {
          start = i;
        } else if (el.top >= this.scroll.top) {
          end = i;
        }

        i = ~~((start + end) / 2);
      } while (i !== oldI && start !== end);

      // Normalize index
      if (i < 0) i = 0;
      if (i > count - 1) i = count - 1;

      return i;
    },
  },
  beforeUnmount() {
    this.stopVirtualList();
  },
});
</script>

<style lang="scss">
@import "@/scss/main";
</style>
