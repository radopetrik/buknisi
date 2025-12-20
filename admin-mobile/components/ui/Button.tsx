import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
}

export function Button({ className, title, variant = "primary", isLoading, ...props }: ButtonProps) {
  const baseStyles = "h-12 flex-row items-center justify-center rounded-md px-6";
  const variants = {
    primary: "bg-black",
    secondary: "bg-gray-100",
    outline: "border border-gray-200 bg-white",
    ghost: "bg-transparent",
  };
  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-gray-900 font-medium",
    outline: "text-gray-900 font-medium",
    ghost: "text-gray-700 font-medium",
  };

  return (
    <TouchableOpacity
      className={cn(baseStyles, variants[variant], props.disabled && "opacity-50", className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "primary" ? "white" : "black"} />
      ) : (
        <Text className={cn("text-base", textVariants[variant])}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
