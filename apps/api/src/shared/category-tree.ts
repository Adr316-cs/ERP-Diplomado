export const categoryParentWouldCycle = (categoryId: string, parentChain: readonly string[]) =>
  parentChain.includes(categoryId) || new Set(parentChain).size !== parentChain.length;
