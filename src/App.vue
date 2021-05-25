<template>
  <div class="page raw">
    <h4>Raw</h4>

    <textarea class="full" v-model="jsonRaw"></textarea>
  </div>

  <div class="page pretty">
    <h4>Vue3Json</h4>

    <vue-json
      v-model="json"
      :depth="depthNumber"
      :value-parser="enableParser ? valueParser : null"
      v-bind="options"
      class="full"
    />
  </div>

  <div class="page options center">
    <h1>Vue Jsonify</h1>

    <div class="inputs">
      <div class="input header">
        <span>Max Depth: </span>
        <input type="number" v-model="depth" />
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.tablines" />
        <span>Use Tab Lines</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.showLength" />
        <span>Show Length</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.showQuotes" />
        <span>Show Quotes</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.collapseButton" />
        <span>Collapse Buttons</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.collapseBracket" />
        <span>Collapse Brackets</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.lineNumbers" />
        <span>Line Numbers</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.singleLine" />
        <span>Single Line</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="options.virtualList" />
        <span>Virtual List (Performance)</span>
      </div>

      <div class="input">
        <input type="checkbox" v-model="enableParser" />
        <span>Custom Parser</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import example from "./examples/example2.json";
import { VJOptions } from "./types";

export default defineComponent({
  name: "App",
  data() {
    return {
      depth: 6,
      enableParser: true,
      options: {
        tablines: true,
        showLength: true,
        showQuotes: true,
        collapseButton: true,
        collapseBracket: true,
        lineNumbers: true,
        virtualList: true,
        singleLine: true,
      } as Partial<VJOptions>,
      debounce: null as number | null,
      json: example,
    };
  },
  computed: {
    depthNumber(): number {
      return +this.depth;
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
html,
body {
  margin: 0;
  padding: 0;
  font-size: 12pt;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  flex-direction: row;
  justify-content: center;

  h1 {
    margin-top: 2em;
  }

  .page {
    flex-grow: 1;
    flex-basis: 0;
    max-height: 100%;
    padding: 1em;
    min-width: 30%;

    h4,
    h5 {
      text-align: center;
    }

    &.pretty {
      .vj-app {
        max-height: 90vh;
        border-radius: 0.25em;
        border: 1px solid #ccc;
      }
    }

    &.raw {
      textarea {
        border-radius: 0.25em;
        border: 1px solid #ccc;
        max-height: 90vh;
      }
    }

    &.center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .inputs {
      text-align: left;
      width: 300px;

      .input {
        margin: 0.25em;

        &.header {
          margin-bottom: 1em;
        }
      }
    }
  }

  .full {
    width: 100%;
    height: 100%;
  }
}

@media screen and (max-width: 1024px) {
  html,
  body {
    overflow-y: auto;
  }

  #app {
    flex-direction: column;
    height: auto;
  }

  .page {
    max-height: 80vh;

    &.pretty {
      order: 1;

      .vj-app {
        height: 80vh !important;
      }
    }
    &.raw {
      order: 2;

      textarea {
        height: 80vh !important;
      }
    }
    &.options {
      order: 3;
    }
  }
}
</style>
