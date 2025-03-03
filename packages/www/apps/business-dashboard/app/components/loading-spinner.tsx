interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent";
}

export default function LoadingSpinner({
  size = "md",
  color = "primary",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    primary: "border-primary/25 border-t-primary",
    secondary: "border-secondary/25 border-t-secondary",
    accent: "border-accent/25 border-t-accent",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={` ${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full`}
      />
    </div>
  );
}
