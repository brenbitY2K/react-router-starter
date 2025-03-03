import * as React from "react";
import { cn } from "../../utils/index.js";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode;
  adornmentWidth?: number;
}

const ADORNMENT_PADDING = 11;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, ...props }, ref) => {
    const adornmentRef = React.useRef<HTMLSpanElement>(null);
    const [adornmentWidth, setAdornmentWidth] = React.useState(
      props.adornmentWidth ?? 0,
    );

    React.useEffect(() => {
      if (adornmentRef.current) {
        setAdornmentWidth(adornmentRef.current.offsetWidth);
      }
    }, [startAdornment]);

    return (
      <div className="relative flex w-full items-center">
        {startAdornment && (
          <span
            ref={adornmentRef}
            className="text-muted-foreground absolute left-3 select-none text-sm"
          >
            {startAdornment}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "border-input bg-base-200 ring-offset-base-100 placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          style={{
            paddingLeft: startAdornment
              ? `${adornmentWidth + ADORNMENT_PADDING}px`
              : undefined,
          }}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
