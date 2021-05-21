<template>
  <div class="vj-app" style="display: flex">
    <div style="padding: 0 3em 0 2em; text-align: left">
      <pre>{{ scroll }}</pre>
      <pre>{{ view }}</pre>
      <pre>{{ startEntry ? startEntry.index : "null" }}</pre>
      <pre>{{ endEntry ? endEntry.index : "null" }}</pre>
    </div>

    <div
      ref="viewContent"
      :class="['vj-content', { hoverable: isHoverable }]"
      style="border: 1px solid"
    >
      <div class="vj-content__view" :style="viewStyle">
        <vj-node
          v-for="el in renderElements"
          :key="el.index"
          :token="el"
          :style="nodeStyle"
          :show-length="showLength"
          :show-quotes="showQuotes"
          v-model:collapsed="el.collapsed"
          @update:collapsed="(collapsed) => updateCollapse(el.index, collapsed)"
          @mounted="onElementMounted"
        ></vj-node>
      </div>
    </div>

    <!-- Hidden Helpers :D -->
    <div class="vj-helper">
      <span ref="lineNumberWidthRef">{{ elements.length - 1 }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  provide,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";
import { VJToken, useParser, VJTokenType } from "@/composables/useParser";
import {
  VJLineNumberWidthKey,
  VJOptionsKey,
  VJTokenListKey,
} from "@/injection-keys";
import vjNodeVue from "./components/vj-node.vue";

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
      startEntry: null as VJToken<VJTokenType> | null,
      endEntry: null as VJToken<VJTokenType> | null,
      scrollDirty: false,
      prerender: 1,
    };
  },
  setup(props) {
    const propsRef = toRefs(props);
    const { modelValue, depth, hoverable, lineHeight } = propsRef;

    // Provide helpers
    const lineNumberWidth = ref<number>(0);
    provide(VJLineNumberWidthKey, lineNumberWidth);

    const options = reactive({
      depth: depth,
      tablines: propsRef.tablines,
    });

    // Provide plugin props
    provide(VJOptionsKey, options);

    const parserOptions = computed(() => ({
      maxDepth: depth.value,
    }));

    const elements = ref(useParser(modelValue.value, parserOptions.value));
    provide(VJTokenListKey, elements);

    // Elements heights
    const heightList = ref<number[]>(
      new Array(elements.value.length).fill(lineHeight.value)
    );

    // Watch model value
    watch(modelValue, (val) => {
      elements.value = useParser(val, parserOptions.value);

      // Update height list
      heightList.value = new Array(elements.value.length).fill(
        lineHeight.value
      );
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
      heightList,
      lineNumberWidth,
      // showLength: propsRef.showLength,
      // showQuotes: propsRef.showQuotes,
    };
  },
  mounted() {
    if (!this.viewContent) return;
    this.updateViewSize();
    this.updateEntries();

    // Add content scroll event listener
    this.viewContent.addEventListener("scroll", this.onScroll);

    // Helpers
    if (this.$refs.lineNumberWidthRef) {
      this.lineNumberWidth =
        (this.$refs.lineNumberWidthRef as HTMLElement).offsetWidth ?? 0;
    }
  },
  computed: {
    visibleElements(): VJToken<VJTokenType>[] {
      return (
        this.elements.filter((el: VJToken<VJTokenType>) => el.visible) ?? []
      );
    },
    renderElements(): VJToken<VJTokenType>[] {
      const start = this.startEntry?.index ?? 0;
      const end = this.endEntry?.index;
      return this.visibleElements.slice(start, end);
    },
    nodeStyle(): Record<string, string> {
      const startIndex = this.startEntry?.index ?? 0;
      const top = this.visibleHeightsAcc[startIndex - 1] ?? 0;

      return {
        transform: `translateY(${top}px)`,
      };
    },
    viewStyle(): Record<string, string> {
      return {
        height: `${this.scroll.height}px`,
      };
    },
    visibleHeightsAcc(): number[] {
      return this.visibleElements
        .reduce((arr, token, i) => {
          arr.push(this.heightList[token.index] + (arr[i - 1] ?? 0));
          return arr;
        }, [] as number[])
        .filter((n) => typeof n === "number" && !isNaN(n));
    },
  },
  watch: {
    visibleElements() {
      this.updateViewSize();
      this.updateEntries();
    },
  },
  methods: {
    updateViewSize() {
      if (!this.viewContent) return;

      const height = this.viewContent.clientHeight;
      const scrollTop = this.viewContent.scrollTop;
      const scrollHeight = this.viewContent.scrollHeight;
      this.scroll = {
        top: scrollTop,
        height: this.visibleHeightsAcc
          ? this.visibleHeightsAcc[this.visibleHeightsAcc.length - 1]
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
        });
      }
    },
    onElementMounted(el: HTMLElement, token: VJToken<VJTokenType>) {
      if (el && typeof el.clientHeight !== "undefined") {
        this.heightList[token.index] = el.clientHeight;
      }
    },
    isCollapsed(el: VJToken<VJTokenType>) {
      if (!el) return false;
      if (el.collapsed) return true;

      let parent = el.parent;
      while (parent) {
        if (parent.collapsed) return true;
        parent = parent.parent;
      }
      return false;
    },
    updateCollapse(index: number, collapsed: boolean) {
      const el = this.elements[index];
      const { depth } = el;

      let next,
        dir = el.role === "open" ? 1 : -1;
      let i = index;
      do {
        i += dir;
        next = this.elements[i];

        if (next.depth === depth) {
          next.collapsed = collapsed;
        } else {
          next.visible = !collapsed
            ? (!next.parent || !this.isCollapsed(next.parent)) ?? !collapsed
            : !collapsed;
        }
      } while (i >= 0 && i <= this.elements.length - 1 && next.depth > depth);
    },
    updateEntries() {
      this.startEntry = this.binEntrySearch();

      // Find end entry
      const count = this.visibleElements.length;
      const startIdx = this.startEntry ? this.startEntry.index : 0;

      let endIdx;
      for (endIdx = startIdx; endIdx < count; endIdx++) {
        const bottom = this.visibleHeightsAcc[endIdx];
        if (bottom > this.scroll.end) {
          break;
        }
      }

      endIdx = Math.min(endIdx + this.prerender, count - 1);
      this.endEntry = this.visibleElements[endIdx];
    },
    binEntrySearch() {
      const count = this.visibleElements.length;

      let start = 0;
      let end = count - 1;
      let i = ~~(count / 2);
      let oldI, height;

      do {
        oldI = i;
        height = this.visibleHeightsAcc[i];

        if (height < this.scroll.top) {
          start = i;
        } else if (
          i < count - 1 &&
          this.visibleHeightsAcc[i + 1] > this.scroll.top
        ) {
          end = i;
        }

        i = ~~((start + end) / 2);
      } while (i !== oldI);

      // Prerender
      i -= this.prerender;

      // Normalize index
      if (i < 0) i = 0;
      if (i > count - 1) i = count - 1;

      return this.visibleElements[i];
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
