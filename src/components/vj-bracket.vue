<template>
  <br v-if="inArray" />
  <span class="vj-el vj-el__bracket" :class="classes">
    <span class="vj-el--flex">
      <vj-tab :token="token" />

      <span
        class="vj-el__token vj-el--clickable"
        v-text="token.value"
        @click="toggleCollapse"
      ></span>
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from "vue";
import { useCollapsable } from "@/composables/useCollapsable";
import { JSONTokenLoaded } from "@/composables/useParser";
import vjTabVue from "./vj-tab.vue";

export default defineComponent({
  name: "vj-bracket",
  components: {
    "vj-tab": vjTabVue,
  },
  props: {
    token: {
      type: Object as PropType<JSONTokenLoaded>,
      required: true,
    },
    collapsed: {
      type: Boolean,
      default: () => false,
    },
  },
  setup(props, context) {
    const propsRef = toRefs(props);

    const { classes, toggleCollapse } = useCollapsable(
      propsRef.collapsed,
      context
    );

    return { classes, toggleCollapse };
  },
  computed: {
    inArray(): boolean {
      return this.token.context === "array";
    },
  },
});
</script>
