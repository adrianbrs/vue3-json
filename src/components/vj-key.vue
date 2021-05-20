<template>
  <br />
  <span class="vj-el vj-el__key">
    <span class="vj-el__token vj-el--flex">
      <vj-tab :token="token" />

      <span class="vj-el vj-el__token" v-text="token.value"></span>
      <span class="vj-el vj-el__colon">:&nbsp;</span>
    </span>
  </span>
</template>

<script lang="ts">
import { JSONTokenLoaded } from "@/composables/useParser";
import { defineComponent, PropType } from "vue";
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
  },
});
</script>
