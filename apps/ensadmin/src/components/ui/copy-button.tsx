"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
  showToast = true,
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
      toast.error("Failed to copy text to clipboard");
    } finally {
      setIsCopying(false);
    }
  }

  const defaultIcon = <ClipboardIcon className="h-4 w-4" />;
  const defaultSuccessIcon = <CheckIcon className="h-4 w-4" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={copyToClipboard}
      disabled={isCopying}
      className={cn(className)}
      {...props}
    >
      {hasCopied ? successIcon || defaultSuccessIcon : icon || defaultIcon}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
}
