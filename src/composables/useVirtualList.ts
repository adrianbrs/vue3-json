import { VJToken, VJTokenType } from "@/types";
import {
  VJVirtualListNode,
  VJVirtualListOptions,
  VJVirtualListScroll,
  VJVirtualListView,
} from "@/types/virtualList";
import ResizeObserver from "resize-observer-polyfill";
import {
  ComponentPublicInstance,
  computed,
  ComputedRef,
  nextTick,
  onMounted,
  Ref,
  ref,
  watch,
} from "vue";

/**
 * Executes a binary search to find first node that needs to be shown
 * @param nodes List of visible nodes
 * @param scroll
 */
function binEntrySearch(
  nodes: ComputedRef<VJVirtualListNode[]>,
  scroll: Ref<VJVirtualListScroll>
) {
  const count = nodes.value.length;

  let start = 0;
  let end = count;
  let i = ~~(count / 2);
  let oldI, el;

  do {
    oldI = i;
    el = nodes.value[i];

    if (el.bottom < scroll.value.top) {
      start = i;
    } else if (el.top > scroll.value.top) {
      end = i;
    }

    i = ~~((start + end) / 2);
  } while (i !== oldI && start !== end);

  // Normalize index
  if (i < 0) i = 0;
  if (i > count - 1) i = count - 1;

  return i;
}

function getEntries(
  nodes: ComputedRef<VJVirtualListNode[]>,
  scroll: Ref<VJVirtualListScroll>
) {
  let startEntry = 0;
  let endEntry = 0;

  startEntry = binEntrySearch(nodes, scroll);

  // Find end entry
  const count = nodes.value.length;

  let endIdx;
  for (endIdx = startEntry; endIdx < count; endIdx++) {
    const bottom = nodes.value[endIdx].bottom;
    if (bottom > scroll.value.bottom) {
      break;
    }
  }

  endIdx = Math.min(endIdx + 1, count);
  endEntry = Math.max(endIdx, 1);

  return { startEntry, endEntry };
}

export function useVirtualList(
  elements: ComputedRef<VJToken<VJTokenType>[]>,
  visibleElements:
    | ComputedRef<VJToken<VJTokenType>[]>
    | Ref<VJToken<VJTokenType>[]>,
  options: VJVirtualListOptions
) {
  const viewContent = options.viewRef;
  const vlStartEntry = ref(0);
  const vlEndEntry = ref(0);
  const vlScroll = ref({
    top: 0,
    bottom: 0,
    height: 0,
  } as VJVirtualListScroll);
  const vlView = ref({
    width: 0,
    height: 0,
  } as VJVirtualListView);

  const vlNodeList = computed(
    () =>
      visibleElements.value.reduce((arr, token, i) => {
        const height = options.lineHeight.value;
        const top = arr[i - 1] ? arr[i - 1].bottom : 0;
        arr.push({
          token,
          index: i,
          height,
          top,
          bottom: height + top,
        });

        return arr;
      }, [] as VJVirtualListNode[]) ?? []
  );

  const updateViewSize = () => {
    if (!viewContent.value) return;
    const { clientHeight, clientWidth, scrollTop, scrollHeight } =
      viewContent.value;

    vlScroll.value = {
      top: scrollTop,
      height: visibleElements.value
        ? vlNodeList.value[vlNodeList.value.length - 1]?.bottom
        : scrollHeight,
      bottom: scrollTop + clientHeight,
    };

    vlView.value = {
      height: clientHeight,
      width: clientWidth,
    };
  };

  const updateEntries = () => {
    const entries = getEntries(vlNodeList, vlScroll);
    vlStartEntry.value = entries.startEntry;
    vlEndEntry.value = entries.endEntry;
  };

  let updatingView = false;
  const updateVLView = () => {
    // Update view only after each animation frame
    if (!updatingView) {
      updatingView = true;
      requestAnimationFrame(() => {
        updatingView = false;

        // Update view size again to calculate scroll bottom
        updateViewSize();
        updateEntries();
      });
    }
  };

  const onViewResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0];

    if (entry) {
      updateVLView();
    }
  };

  const onViewScroll = () => {
    updateVLView();
  };

  const resizeObserver = new ResizeObserver(onViewResize);

  const startVirtualList = () => {
    if (!viewContent.value) return;

    // Listen to view scroll
    viewContent.value.addEventListener("scroll", onViewScroll);

    // Create view resize observer
    resizeObserver.observe(viewContent.value);

    nextTick(() => {
      updateVLView();
    });
  };

  const stopVirtualList = () => {
    if (!viewContent.value) return;

    // Remove listener and observer
    viewContent.value.removeEventListener("scroll", onViewScroll);
    resizeObserver.unobserve(viewContent.value);
  };

  watch(visibleElements, () => {
    updateVLView();
  });

  // Nodes to render
  const vlViewableNodes = computed(() => {
    const preRender = options.preRender?.value ?? 0;
    const start = Math.max(vlStartEntry.value - preRender, 0);
    return vlNodeList.value.slice(start, vlEndEntry.value + preRender);
  });

  // Mounted hooks
  onMounted(() => {
    updateViewSize();
  });

  return {
    startVirtualList,
    stopVirtualList,
    updateVLView,
    vlNodeList,
    vlViewableNodes,
    vlStartEntry,
    vlEndEntry,
    vlScroll,
    vlView,
  };
}
