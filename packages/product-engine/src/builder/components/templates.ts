/**
 * Component Templates
 *
 * Starter templates for React components.
 */

export interface ComponentTemplate {
  name: string;
  description: string;
  files: {
    path: string;
    content: string;
  }[];
  dependencies: string[];
  devDependencies: string[];
}

export const COMPONENT_TEMPLATES: Record<string, ComponentTemplate> = {
  /**
   * Basic React component
   */
  basic: {
    name: "Basic Component",
    description: "Simple React functional component with TypeScript",
    files: [
      {
        path: "{{NAME}}.tsx",
        content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface {{NAME}}Props {
  className?: string;
  children?: React.ReactNode;
}

export function {{NAME}}({ className, children, ...props }: {{NAME}}Props) {
  return (
    <div className={cn("{{CSS_CLASS}}", className)} {...props}>
      {children}
    </div>
  );
}
`,
      },
      {
        path: "{{NAME}}.test.tsx",
        content: `import { render, screen } from "@testing-library/react";
import { {{NAME}} } from "./{{NAME}}";

describe("{{NAME}}", () => {
  it("renders children", () => {
    render(<{{NAME}}>Test Content</{{NAME}}>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<{{NAME}} className="custom">Content</{{NAME}}>);
    expect(screen.getByText("Content")).toHaveClass("custom");
  });
});
`,
      },
      {
        path: "index.ts",
        content: `export { {{NAME}}, type {{NAME}}Props } from "./{{NAME}}";
`,
      },
    ],
    dependencies: ["react"],
    devDependencies: ["@testing-library/react", "vitest"],
  },

  /**
   * Interactive component with state
   */
  interactive: {
    name: "Interactive Component",
    description: "React component with state and event handlers",
    files: [
      {
        path: "{{NAME}}.tsx",
        content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface {{NAME}}Props {
  className?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function {{NAME}}({
  className,
  defaultValue = "",
  onChange,
  disabled = false,
  ...props
}: {{NAME}}Props) {
  const [value, setValue] = React.useState(defaultValue);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div
      className={cn(
        "{{CSS_CLASS}}",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md"
      />
    </div>
  );
}
`,
      },
      {
        path: "{{NAME}}.test.tsx",
        content: `import { render, screen, fireEvent } from "@testing-library/react";
import { {{NAME}} } from "./{{NAME}}";

describe("{{NAME}}", () => {
  it("renders with default value", () => {
    render(<{{NAME}} defaultValue="test" />);
    expect(screen.getByDisplayValue("test")).toBeInTheDocument();
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    render(<{{NAME}} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new" } });
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("is disabled when disabled prop is true", () => {
    render(<{{NAME}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
`,
      },
      {
        path: "index.ts",
        content: `export { {{NAME}}, type {{NAME}}Props } from "./{{NAME}}";
`,
      },
    ],
    dependencies: ["react"],
    devDependencies: ["@testing-library/react", "vitest"],
  },

  /**
   * Web3 wallet component
   */
  web3_wallet: {
    name: "Web3 Wallet Component",
    description: "Component with Solana wallet integration",
    files: [
      {
        path: "{{NAME}}.tsx",
        content: `import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";

export interface {{NAME}}Props {
  className?: string;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function {{NAME}}({ className, onConnect, onDisconnect }: {{NAME}}Props) {
  const { publicKey, connected, disconnect } = useWallet();

  React.useEffect(() => {
    if (connected && publicKey) {
      onConnect?.(publicKey.toBase58());
    }
  }, [connected, publicKey, onConnect]);

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect?.();
  };

  return (
    <div className={cn("{{CSS_CLASS}}", className)}>
      {connected ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </span>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <WalletMultiButton />
      )}
    </div>
  );
}
`,
      },
      {
        path: "index.ts",
        content: `export { {{NAME}}, type {{NAME}}Props } from "./{{NAME}}";
`,
      },
    ],
    dependencies: ["react", "@solana/wallet-adapter-react", "@solana/wallet-adapter-react-ui"],
    devDependencies: ["@testing-library/react", "vitest"],
  },

  /**
   * Data display component
   */
  data_display: {
    name: "Data Display Component",
    description: "Component for displaying data with loading states",
    files: [
      {
        path: "{{NAME}}.tsx",
        content: `import * as React from "react";
import { cn } from "@/lib/utils";

export interface {{NAME}}Data {
  id: string;
  label: string;
  value: string | number;
}

export interface {{NAME}}Props {
  className?: string;
  data: {{NAME}}Data[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function {{NAME}}({
  className,
  data,
  loading = false,
  error,
  emptyMessage = "No data available",
}: {{NAME}}Props) {
  if (loading) {
    return (
      <div className={cn("{{CSS_CLASS}} animate-pulse", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("{{CSS_CLASS}} text-red-500", className)}>
        Error: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("{{CSS_CLASS}} text-gray-500", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("{{CSS_CLASS}} space-y-2", className)}>
      {data.map((item) => (
        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span className="text-gray-600">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
`,
      },
      {
        path: "{{NAME}}.test.tsx",
        content: `import { render, screen } from "@testing-library/react";
import { {{NAME}} } from "./{{NAME}}";

describe("{{NAME}}", () => {
  const mockData = [
    { id: "1", label: "Label 1", value: "Value 1" },
    { id: "2", label: "Label 2", value: 100 },
  ];

  it("renders data correctly", () => {
    render(<{{NAME}} data={mockData} />);
    expect(screen.getByText("Label 1")).toBeInTheDocument();
    expect(screen.getByText("Value 1")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<{{NAME}} data={[]} loading />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<{{NAME}} data={[]} error="Something went wrong" />);
    expect(screen.getByText("Error: Something went wrong")).toBeInTheDocument();
  });

  it("shows empty message", () => {
    render(<{{NAME}} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
`,
      },
      {
        path: "index.ts",
        content: `export { {{NAME}}, type {{NAME}}Props, type {{NAME}}Data } from "./{{NAME}}";
`,
      },
    ],
    dependencies: ["react"],
    devDependencies: ["@testing-library/react", "vitest"],
  },
};

/**
 * Get template by name
 */
export function getComponentTemplate(name: string): ComponentTemplate | undefined {
  return COMPONENT_TEMPLATES[name];
}

/**
 * List available templates
 */
export function listComponentTemplates(): Array<{ name: string; description: string }> {
  return Object.entries(COMPONENT_TEMPLATES).map(([key, template]) => ({
    name: key,
    description: template.description,
  }));
}
