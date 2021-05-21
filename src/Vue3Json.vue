<template>
  <div class="vj-app">
    <div ref="viewContent" :class="['vj-content', { hoverable: isHoverable }]">
      <div class="vj-content__line-numbers" v-if="showLineNumbers">
        <span
          class="vj-el__line-number"
          v-for="line in lineNumberElements"
          :key="line"
          :style="{
            ...nodeStyle,
            width: `${lineNumWidth}px`,
            flex: `0 0 ${heightList[line]}px`,
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
      <div class="vj-content__view" :style="viewStyle">
        <!-- <textarea class="vj-el__textarea"></textarea> -->

        <vj-node
          v-for="el in renderElements"
          :key="el.index"
          :token="el"
          :style="nodeStyle"
          v-model:collapsed="el.collapsed"
          @update:collapsed="(collapsed) => updateCollapse(el.index, collapsed)"
          @mounted="onElementMounted"
        ></vj-node>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  provide,
  reactive,
  ref,
  ToRefs,
  toRefs,
  watch,
} from "vue";
import { VJToken, useParser, VJTokenType } from "@/composables/useParser";
import { VJOptionsKey, VJTokenListKey } from "@/injection-keys";
import vjNodeVue from "@/components/vj-node.vue";
import { VJOptions, VJValueParser } from "@/types";

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
      default: () => 23,
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
        top: 0,
        bottom: 0,
      },
      startEntry: 0,
      endEntry: 0,
      scrollDirty: false,
      prerender: 1,
      heightList: [] as number[],
      lineNumWidth: 0,
    };
  },
  setup(props) {
    const propsRef = toRefs(props);
    const { modelValue, depth, hoverable, lineNumbers } = propsRef;

    // Line number max width ref
    const lineNumWidthRef = ref<HTMLElement | null>(null);

    const options = reactive({
      depth: depth,
      tablines: propsRef.tablines,
      showQuotes: propsRef.showQuotes,
      showLength: propsRef.showLength,
      valueParser: propsRef.valueParser,
      collapseBracket: propsRef.collapseBracket,
      collapseButton: propsRef.collapseButton,
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
      elements.value = useParser(val, parserOptions.value);
    });

    // Watch parser options change
    watch(parserOptions, (opts) => {
      elements.value = useParser(modelValue.value, opts);
    });

    // Content View
    const viewContent = ref<HTMLDivElement | null>(null);

    return {
      viewContent,
      elements,
      isHoverable: hoverable,
      showLineNumbers: lineNumbers,
      lineNumWidthRef,
    };
  },
  created() {
    this.elements.forEach((el) => {
      this.heightList.push(this.lineHeight);
    });
  },
  mounted() {
    if (!this.viewContent) return;
    this.updateViewSize();
    this.updateEntries();

    // Add content scroll event listener
    this.viewContent.addEventListener("scroll", this.onScroll);

    this.updateLineNumWidth();
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
              const height = this.heightList[token.index] ?? this.lineHeight;
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
      const start = this.startEntry ?? 0;
      const end = this.endEntry;
      return this.visibleElements.slice(start, end).map((v) => v.token);
    },
    lineNumberElements(): number[] {
      return this.renderElements.map((el) => el.index);
    },
    nodeStyle(): Record<string, string> {
      const startIndex = this.startEntry ?? 0;
      const top = this.visibleElements[startIndex].top ?? 0;

      return {
        transform: `translateY(${top}px)`,
      };
    },
    viewStyle(): Record<string, string> {
      return {
        height: `${this.scroll.height}px`,
      };
    },
  },
  watch: {
    visibleElements() {
      this.updateViewSize();
      this.updateEntries();
    },
  },
  methods: {
    updateLineNumWidth() {
      // Get max line number width
      if (this.lineNumWidthRef && this.lineNumWidthRef.offsetWidth) {
        const width = this.lineNumWidthRef.offsetWidth;
        if (width > this.lineNumWidth) {
          this.lineNumWidth = width;
        }
      }
    },
    updateViewSize() {
      if (!this.viewContent) return;

      const height = this.viewContent.clientHeight;
      const scrollTop = this.viewContent.scrollTop;
      const scrollHeight = this.viewContent.scrollHeight;
      this.scroll = {
        top: scrollTop,
        height: this.visibleElements
          ? this.visibleElements[this.visibleElements.length - 1].bottom
          : scrollHeight,
        end: scrollTop + height,
      };

      const top = this.viewContent.offsetTop;

      this.view = {
        height,
        top,
        bottom: top + height,
      };
    },
    onScroll() {
      this.updateViewSize();

      if (!this.scrollDirty) {
        this.scrollDirty = true;

        requestAnimationFrame(() => {
          this.scrollDirty = false;
          this.updateEntries();
          this.updateLineNumWidth();
        });
      }
    },
    onElementMounted(el: HTMLElement, token: VJToken<VJTokenType>) {
      if (el && typeof el.clientHeight !== "undefined") {
        this.heightList[token.index] = el.clientHeight;
      }
    },
    isCollapsed(el: VJToken<VJTokenType>) {
      if (!el) return true;
      if (el.collapsed || (el.groupToken && el.groupToken.collapsed))
        return true;

      let parent = el.parent;
      while (parent) {
        if (
          parent.collapsed ||
          (parent.groupToken && parent.groupToken.collapsed)
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    },
    updateCollapse(index: number, collapsed: boolean): void {
      const el = this.elements[index];
      if (el.role === "close" && el.groupToken) {
        return this.updateCollapse(el.groupToken.index, collapsed);
      }
      const { depth } = el;
      el.collapsed = collapsed;

      // Change group token collapse
      if (el.groupToken) {
        const { groupToken } = el;
        groupToken.collapsed = collapsed;

        if (groupToken.role === "close") {
          groupToken.visible = !collapsed;
        }
      }

      // Childrens
      let i = index + 1;
      let next = this.elements[i];

      while (next && next.depth > depth) {
        if (
          collapsed ||
          (next.parent && this.isCollapsed(next.parent)) ||
          (next.collapsed && next.role === "close")
        ) {
          next.visible = false;
        } else if (
          next.depth === depth + 1 ||
          !next.parent ||
          !this.isCollapsed(next.parent)
        ) {
          next.visible = true;
        }

        i++;
        next = this.elements[i];
      }
    },
    updateEntries() {
      this.startEntry = this.binEntrySearch();

      // Find end entry
      const count = this.visibleElements.length;

      let endIdx;
      for (endIdx = this.startEntry; endIdx < count; endIdx++) {
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
    this.viewContent?.removeEventListener("scroll", this.onScroll);
  },
});
</script>

<style lang="scss">
@import "@/scss/main";
</style>
