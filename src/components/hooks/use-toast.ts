// Placeholder hook for shadcn toast (not used - we use sonner instead)
// This file exists only to satisfy TypeScript imports

import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  return {
    toasts,
    toast: () => {},
    dismiss: () => {},
  };
}
