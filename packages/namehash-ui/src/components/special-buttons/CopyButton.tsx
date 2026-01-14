import * as React from "react";
import { toast } from "sonner";

import { cn } from "../../utils/cn";
import { Button, type ButtonProps } from "../ui/button";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  message?: string;
  showToast?: boolean;
  icon?: React.ReactNode;
  successIcon?: React.ReactNode;
}

export function CopyButton({
  value,
  message = "Copied to clipboard",
  variant = "ghost",
  size = "icon",
  showToast = false,
  icon,
  successIcon,
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  async function copyToClipboard() {
    if (isCopying) return;

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(value);
      setHasCopied(true);

      if (showToast) {
        toast.success(message);
      }
    } catch (error) {
      console.error("Failed to copy text:", error);

      if (showToast) {
        toast.error("Failed to copy text to clipboard");
      }
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      type="button"
      onClick={copyToClipboard}
      disabled={isCopying}
      className={cn("nhui:cursor-pointer", className)}
      {...props}
    >
      {hasCopied ? (successIcon ? successIcon : "Copied") : icon ? icon : "Copy"}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
}
