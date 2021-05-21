<template>
  <h1>Vue3Json Demo</h1>

  <input type="number" v-model="depth" />

  <div>
    <input type="checkbox" v-model="tablines" />
    <span>Use Tab Lines</span>
  </div>

  <div>
    <input type="checkbox" v-model="showLength" />
    <span>Show Length</span>
  </div>

  <div>
    <input type="checkbox" v-model="showQuotes" />
    <span>Show Quotes</span>
  </div>

  <div style="display: flex">
    <vue-json
      v-model="json"
      :depth="depthNumber"
      :tablines="tablines"
      :show-length="showLength"
      :show-quotes="showQuotes"
      style="height: 600px; width: 900px"
    />

    <textarea v-model="jsonRaw" cols="50" rows="10"></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  data() {
    return {
      depth: 3,
      tablines: true,
      showLength: true,
      showQuotes: true,
      debounce: null as number | null,
      json: {
        str: "str",
        num: 1,
        arr: ["item 1", 1, { sub: "test" }, ["subarr"]],
        obj: {
          prop: "strprop",
        },
        last: {
          inner: {
            join: {
              more: {
                deep: {
                  uou: [
                    "hello",
                    {
                      eita: "aaa",
                    },
                  ],
                },
              },
            },
          },
        },
      },
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
