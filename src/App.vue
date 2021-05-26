<template>
  <div class="section raw">
    <h4>Raw</h4>
    <textarea v-model="jsonRaw"></textarea>
  </div>

  <div class="section parsed">
    <h4>Parsed</h4>

    <div class="tabs">
      <a
        v-for="(ex, i) in example.list"
        :key="i"
        href="#"
        :class="['tab', { active: i === example.selected }]"
        @click="example.selected = i"
        >Example {{ i }}</a
      >
    </div>

    <vue-json
      v-model="json"
      :depth="depthNumber"
      :value-parser="enableParser ? valueParser : null"
      v-bind="options"
    />
  </div>

  <div class="section options">
    <h1>Vue3Json</h1>

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
import { VJOptions } from "./types/vue3json";

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
      } as Partial<VJOptions>,
      debounce: null as number | null,
      example: {
        list: [] as unknown[],
        selected: 0,
      },
    };
  },
  async beforeCreate() {
    // Load examples
    const context = require.context("./examples", false, /\.json$/);
    const examples = await Promise.all(
      context.keys().map(async (filename) => {
        return import(`./examples/${filename.replace("./", "")}`).then(
          (m) => m.default
        );
      })
    );

    this.example.list = examples;
  },
  computed: {
    depthNumber(): number {
      return +this.depth;
    },
    json(): unknown {
      return this.example.list[this.example.selected] ?? {};
    },
    jsonRaw: {
      get(): string {
        return JSON.stringify(this.json, null, 2);
      },
      set(val) {
        if (!val) return;
        if (this.debounce !== null) {
          clearTimeout(this.debounce);
        }

        this.debounce = setTimeout(() => {
          this.debounce = null;
          try {
            if (val !== JSON.stringify(this.json)) {
              this.example.list[this.example.selected] = JSON.parse(val);
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
}

* {
  box-sizing: border-box;
}

#app {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: stretch;
  align-items: center;

  .section {
    display: block;
    flex: 1;
    height: 100%;
    max-height: 100%;
    margin: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    h4 {
      margin: 0;
      padding: 2em;
    }

    textarea,
    .vj-app {
      height: 90%;
      width: 100%;
      border: 1px solid #aaa;
      border-radius: 0.2em;
      display: block;
    }

    .vj-app {
      height: 85.5%;
    }
  }

  .tabs {
    width: 100%;
    position: relative;
    display: flex;

    .tab {
      display: block;
      flex: 1 0 auto;
      padding: 12px 16px;
      text-decoration: none;
      color: #08d;
      border: 1px solid #08d;
      text-align: center;
      transition: all 0.1s ease;

      &:first-child {
        border-radius: 0.2em 0 0 0;
      }
      &:last-child {
        border-radius: 0 0.2em 0 0;
      }

      &:hover,
      &.active {
        background-color: #08d;
        color: #fff;
      }
    }
  }
}

@media screen and (max-width: 1024px) {
  #app {
    flex-direction: column;
    height: auto;
    max-height: none;
    padding: 2em;

    .section {
      width: 100%;
      padding: 0;

      &.options {
        order: 0;
      }

      &.parsed {
        order: 1;
      }

      &.raw {
        order: 2;
      }
    }
  }
}
</style>
