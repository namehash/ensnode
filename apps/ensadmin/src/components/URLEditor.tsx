import { Check, Edit2, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { cn } from "../utils/ui";

import { Button } from "./ui/button";

interface URLEditorProps {
  currentUrl: URL;
  className?: string;
}

export function URLEditor({ currentUrl, className }: URLEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentUrl.toString());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setError("URL cannot be empty");
      return;
    }

    if (!validateUrl(inputValue)) {
      setError("Please enter a valid URL");
      return;
    }

    setError(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("ensindexer", inputValue);
    navigate({ search: newParams.toString() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(currentUrl.toString());
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-muted-foreground font-normal">{currentUrl.toString()}</span>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit URL</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            list="ensindexer-urls"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full px-3 py-1.5 text-sm rounded-md border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              error ? "border-destructive" : "border-input",
            )}
            placeholder="Enter ENSIndexer URL"
          />
          <datalist id="ensindexer-urls">
            <option value={currentUrl.toString()} />
          </datalist>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSubmit}
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Confirm</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
