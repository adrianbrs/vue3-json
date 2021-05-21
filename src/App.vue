<template>
  <h1>Vue3Json Demo</h1>

  <input type="number" v-model="options.depth" />

  <div>
    <input type="checkbox" v-model="options.tablines" />
    <span>Use Tab Lines</span>
  </div>

  <div>
    <input type="checkbox" v-model="options.showLength" />
    <span>Show Length</span>
  </div>

  <div>
    <input type="checkbox" v-model="options.showQuotes" />
    <span>Show Quotes</span>
  </div>

  <div>
    <input type="checkbox" v-model="options.collapseButton" />
    <span>Collapse Buttons</span>
  </div>

  <div>
    <input type="checkbox" v-model="options.collapseBracket" />
    <span>Collapse Brackets</span>
  </div>

  <div>
    <input type="checkbox" v-model="options.lineNumbers" />
    <span>Line Numbers</span>
  </div>

  <div style="display: flex">
    <vue-json
      v-model="json"
      :depth="depthNumber"
      :value-parser="valueParser"
      v-bind="options"
      style="height: 600px; width: 900px"
    />

    <textarea v-model="jsonRaw" cols="50" rows="10"></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import example1 from "./examples/example1.json";
import { VJOptions } from "./types";

export default defineComponent({
  name: "App",
  data() {
    return {
      options: {
        depth: 3,
        tablines: true,
        showLength: true,
        showQuotes: true,
        collapseButton: true,
        collapseBracket: true,
        lineNumbers: true,
      } as VJOptions,
      debounce: null as number | null,
      json: example1,
    };
  },
  computed: {
    depthNumber(): number {
      return +this.options.depth;
    },
    jsonRaw: {
      get(): string {
        return JSON.stringify(this.json, null, 2);
      },
      set(val) {
        if (this.debounce !== null) {
          clearTimeout(this.debounce);
        }

        this.debounce = setTimeout(() => {
          this.debounce = null;
          try {
            if (val !== JSON.stringify(this.json)) {
              this.json = JSON.parse(val);
            }
          } catch (err) {
            return;
          }
        }, 1000);
      },
    },
  },
  methods: {
    valueParser(val: string | number) {
      if (typeof val !== "string") return val;

      try {
        const url = new URL(val as string);
        return `<a href="${url}" title="${url}" target="_blank">${url}</a>`;
      } catch (err) {
        return val;
      }
    },
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
