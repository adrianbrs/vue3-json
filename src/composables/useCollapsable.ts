import { Ref, SetupContext } from "@vue/runtime-core";

export function useCollapsable(collapsed: Ref<boolean>, context: SetupContext) {
  const toggleCollapse = () => {
    context.emit("update:collapsed", !collapsed.value);
  };
  return { toggleCollapse };
}
