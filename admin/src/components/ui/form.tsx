import * as React from "react";
import type { FieldPath, FieldValues, ControllerProps } from "react-hook-form";
import { FormProvider, useFormContext, Controller } from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return <Controller {...props} />;
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  ),
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-0", className)} {...props} />
));
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const body = children ? children : props?.id ? <span>{children}</span> : null;

  if (!body) {
    return null;
  }

  return (
    <p ref={ref} className={cn("text-sm font-medium text-red-600", className)} {...props}>
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

const useFormField = () => {
  const fieldContext = useFormContext();
  if (!fieldContext) {
    throw new Error("useFormField should be used within <Form>");
  }
  return fieldContext;
};

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
