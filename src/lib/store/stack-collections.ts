import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistryItem } from '@/types/registry';
import { toast } from 'sonner';

export interface Stack {
  id: string;
  name: string;
  items: RegistryItem[];
  createdAt: string;
  updatedAt: string;
}

interface StackCollectionsStore {
  stacks: Stack[];
  activeStackId: string | null;

  // Stack management
  createStack: (name: string) => string;
  deleteStack: (stackId: string) => void;
  renameStack: (stackId: string, newName: string) => void;
  duplicateStack: (stackId: string) => string;
  setActiveStack: (stackId: string) => void;
  getStacks: () => Stack[];
  getActiveStack: () => Stack | null;

  // Item management within stacks
  addItemToStack: (stackId: string, item: RegistryItem) => void;
  removeItemFromStack: (stackId: string, itemId: string) => void;
  clearStack: (stackId: string) => void;

  // Computed
  getStack: (stackId: string) => Stack | undefined;
  getItemCount: (stackId: string) => number;
  hasItem: (stackId: string, itemId: string) => boolean;
}

export const useStackCollections = create<StackCollectionsStore>()(
  persist(
    (set, get) => ({
      stacks: [],
      activeStackId: null,

      createStack: (name) => {
        const newStack: Stack = {
          id: `stack-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          stacks: [...state.stacks, newStack],
          activeStackId: newStack.id,
        }));

        toast.success(`Created stack "${name}"`);
        return newStack.id;
      },

      deleteStack: (stackId) => {
        const stack = get().getStack(stackId);
        if (!stack) return;

        set((state) => {
          const newStacks = state.stacks.filter((s) => s.id !== stackId);
          const newActiveId =
            state.activeStackId === stackId
              ? newStacks[0]?.id || null
              : state.activeStackId;

          return {
            stacks: newStacks,
            activeStackId: newActiveId,
          };
        });

        toast.success(`Deleted stack "${stack.name}"`);
      },

      renameStack: (stackId, newName) => {
        set((state) => ({
          stacks: state.stacks.map((stack) =>
            stack.id === stackId
              ? { ...stack, name: newName, updatedAt: new Date().toISOString() }
              : stack
          ),
        }));

        toast.success(`Renamed stack to "${newName}"`);
      },

      duplicateStack: (stackId) => {
        const stack = get().getStack(stackId);
        if (!stack) return '';

        const newStack: Stack = {
          id: `stack-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: `${stack.name} (Copy)`,
          items: [...stack.items],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          stacks: [...state.stacks, newStack],
        }));

        toast.success(`Duplicated stack "${stack.name}"`);
        return newStack.id;
      },

      setActiveStack: (stackId) => {
        const stack = get().getStack(stackId);
        if (!stack) return;

        set({ activeStackId: stackId });
        toast.info(`Switched to "${stack.name}"`);
      },

      getStacks: () => {
        return get().stacks;
      },

      getActiveStack: () => {
        const { stacks, activeStackId } = get();
        if (!activeStackId) return null;
        return stacks.find((s) => s.id === activeStackId) || null;
      },

      addItemToStack: (stackId, item) => {
        const stack = get().getStack(stackId);
        if (!stack) return;

        if (get().hasItem(stackId, item.id)) {
          toast.info(`${item.name} is already in this stack`);
          return;
        }

        set((state) => ({
          stacks: state.stacks.map((s) =>
            s.id === stackId
              ? {
                  ...s,
                  items: [...s.items, item],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));

        toast.success(`Added ${item.name} to "${stack.name}"`);
      },

      removeItemFromStack: (stackId, itemId) => {
        const stack = get().getStack(stackId);
        if (!stack) return;

        const item = stack.items.find((i) => i.id === itemId);

        set((state) => ({
          stacks: state.stacks.map((s) =>
            s.id === stackId
              ? {
                  ...s,
                  items: s.items.filter((i) => i.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));

        if (item) {
          toast.success(`Removed ${item.name} from "${stack.name}"`);
        }
      },

      clearStack: (stackId) => {
        const stack = get().getStack(stackId);
        if (!stack) return;

        const count = stack.items.length;

        set((state) => ({
          stacks: state.stacks.map((s) =>
            s.id === stackId
              ? {
                  ...s,
                  items: [],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));

        toast.success(`Cleared ${count} items from "${stack.name}"`);
      },

      getStack: (stackId) => {
        return get().stacks.find((s) => s.id === stackId);
      },

      getItemCount: (stackId) => {
        const stack = get().getStack(stackId);
        return stack ? stack.items.length : 0;
      },

      hasItem: (stackId, itemId) => {
        const stack = get().getStack(stackId);
        return stack ? stack.items.some((i) => i.id === itemId) : false;
      },
    }),
    {
      name: 'gicm-stack-collections',
    }
  )
);
