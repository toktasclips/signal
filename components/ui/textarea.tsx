import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
      "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      "transition-all duration-200",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
