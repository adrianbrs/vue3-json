import { Ref, SetupContext } from "@vue/runtime-core";

export function useCollapsable(
  collapsed: Ref<boolean>,
  emit: SetupContext<"update:collapsed"[]>["emit"]
) {
  const toggleCollapse = () => {
    emit("update:collapsed", !collapsed.value);
  };
  return { toggleCollapse };
}
