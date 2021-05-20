<template>
  <h1>Vue3Json Demo</h1>
  <vue-json v-model="json" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  data() {
    return {
      json: {
        str: "str",
        num: 1,
        arr: ["item 1", 1, { sub: "test" }, ["subarr"]],
        obj: {
          prop: "strprop",
        },
      },
    };
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
