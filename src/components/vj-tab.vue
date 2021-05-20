<template>
  <span class="vj-el vj-el__tab">
    <span v-if="visible">
      <span v-for="i in token.depth" :key="i" class="vj-el__tab-space"></span>
    </span>
  </span>
</template>

<script lang="ts">
import { JSONTokenLoaded } from "@/composables/useParser";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "vj-tab",
  props: {
    token: {
      type: Object as PropType<JSONTokenLoaded>,
      required: true,
    },
  },
  computed: {
    visible(): boolean {
      console.log("visible");
      return !this.token.collapsed || this.token.role !== "close";
    },
  },
});
</script>
