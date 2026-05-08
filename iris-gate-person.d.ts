declare module "@iris-gate/person" {
  export const personGate:
    | {
        commit?: (
          label: string,
          facts: string,
          tags?: string[]
        ) => Promise<{ id?: string; recordId?: string; commitment?: string }>;
      }
    | undefined;

  export function commit(
    label: string,
    facts: string,
    tags?: string[]
  ): Promise<{ id?: string; recordId?: string; commitment?: string }>;
}
