import { computed, Ref, SetupContext } from "@vue/runtime-core";

export function useCollapsable(collapsed: Ref<boolean>, context: SetupContext) {
  const classes = computed(() => ({
    "vj-el--collapsed": collapsed.value,
  }));

  const toggleCollapse = () => {
    context.emit("update:collapsed", !collapsed.value);
  };

  return { classes, toggleCollapse };
}
