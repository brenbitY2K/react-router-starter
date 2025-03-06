import * as React from "react";
import { Image } from "lucide-react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../utils/index.js";

const OrganizationLogo = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-md",
      className,
    )}
    {...props}
  />
));
OrganizationLogo.displayName = AvatarPrimitive.Root.displayName;

const OrganizationLogoImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
OrganizationLogoImage.displayName = AvatarPrimitive.Image.displayName;

const OrganizationLogoFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => {
  let children = props.children;
  if (children === undefined) {
    children = <Image />;
  }

  const propsWithDefaultImageFallback = { ...props, children };
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "bg-muted flex h-full w-full items-center justify-center rounded-md",
        className,
      )}
      {...propsWithDefaultImageFallback}
    />
  );
});
OrganizationLogoFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { OrganizationLogo, OrganizationLogoImage, OrganizationLogoFallback };
