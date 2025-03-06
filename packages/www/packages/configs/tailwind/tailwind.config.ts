import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Omit<Config, "content"> = {
  darkMode: ["class"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    colors: {
      border: "hsla(var(--border) / <alpha-value>)",
      input: "hsla(var(--input) / <alpha-value>)",
      ring: "hsla(var(--ring) / <alpha-value>)",
      base: {
        100: "hsla(var(--base-100) / <alpha-value>)",
        200: "hsla(var(--base-200) / <alpha-value>)",
        300: "hsla(var(--base-300) / <alpha-value>)",
        "100-light": "hsla(var(--base-100-light) / <alpha-value>)",
        "100-dark": "hsla(var(--base-100-dark) / <alpha-value>)",
      },
      foreground: {
        DEFAULT: "hsla(var(--foreground) / <alpha-value>)",
        light: "hsla(var(--foreground-light) / <alpha-value>)",
        dark: "hsla(var(--foreground-dark) / <alpha-value>)",
      },
      primary: {
        DEFAULT: "hsla(var(--primary) / <alpha-value>)",
        foreground: "hsla(var(--primary-foreground) / <alpha-value>)",
        light: "hsla(var(--primary-light) / <alpha-value>)",
        dark: "hsla(var(--primary-dark) / <alpha-value>)",
      },
      secondary: {
        DEFAULT: "hsla(var(--secondary) / <alpha-value>)",
        foreground: "hsla(var(--secondary-foreground) / <alpha-value>)",
      },
      destructive: {
        DEFAULT: "hsla(var(--destructive) / <alpha-value>)",
        foreground: "hsla(var(--destructive-foreground) / <alpha-value>)",
      },
      muted: {
        DEFAULT: "hsla(var(--muted) / <alpha-value>)",
        foreground: "hsla(var(--muted-foreground) / <alpha-value>)",
      },
      accent: {
        DEFAULT: "hsla(var(--accent) / <alpha-value>)",
        foreground: "hsla(var(--accent-foreground) / <alpha-value>)",
        light: "hsla(var(--accent-light) / <alpha-value>)",
        dark: "hsla(var(--accent-dark) / <alpha-value>)",
      },
      success: {
        DEFAULT: "hsla(var(--success) / <alpha-value>)",
        foreground: "hsla(var(--success-foreground) / <alpha-value>)",
      },
      info: {
        DEFAULT: "hsla(var(--info) / <alpha-value>)",
        foreground: "hsla(var(--info-foreground) / <alpha-value>)",
      },
      warning: {
        DEFAULT: "hsla(var(--warning) / <alpha-value>)",
        foreground: "hsla(var(--warning-foreground) / <alpha-value>)",
      },
      popover: {
        DEFAULT: "hsla(var(--popover) / <alpha-value>)",
        foreground: "hsla(var(--popover-foreground) / <alpha-value>)",
      },
      card: {
        DEFAULT: "hsla(var(--card) / <alpha-value>)",
        foreground: "hsla(var(--card-foreground) / <alpha-value>)",
      },
      sidebar: {
        background: "hsla(var(--sidebar-background) / <alpha-value>)",
        foreground: "hsla(var(--sidebar-foreground) / <alpha-value>)",
        primary: "hsla(var(--sidebar-primary) / <alpha-value>)",
        "primary-foreground":
          "hsla(var(--sidebar-primary-foreground) / <alpha-value>)",
        accent: "hsla(var(--sidebar-accent) / <alpha-value>)",
        "accent-foreground":
          "hsla(var(--sidebar-accent-foreground) / <alpha-value>)",
        border: "hsla(var(--sidebar-border) / <alpha-value>)",
        ring: "hsla(var(--sidebar-ring) / <alpha-value>)",
      },
      // Added from first config
      "lmr-light-green": "#98ca3e",
      "lmr-dark-green": "#699e60",
      lime: {
        500: "#98CA3E",
        600: "#7FB726",
      },
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        outline: "0 0 0 1.5px rgba(152, 202, 62, 0.5)",
        "outline-error": "0 0 0 1.5px rgba(255, 0, 0, 0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        glowCounty: {
          "0%": { boxShadow: "0 0 4px #699e60" },
          "50%": { boxShadow: "0 0 7px #699e60, 0 0 13px #699e60" },
          "100%": { boxShadow: "0 0 4px #699e60" },
        },
        glowZip: {
          "0%": { boxShadow: "0 0 4px #98ca3e" },
          "50%": { boxShadow: "0 0 7px #98ca3e, 0 0 13px #98ca3e" },
          "100%": { boxShadow: "0 0 4px #98ca3e" },
        },
        glowPermit: {
          "0%": { boxShadow: "0 0 4px #355E3B" },
          "50%": { boxShadow: "0 0 7px #355E3B, 0 0 13px #355E3B" },
          "100%": { boxShadow: "0 0 4px #355E3B" },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(0)",
            opacity: 0.6,
          },
          "50%": {
            transform: "translateY(-4px)",
            opacity: 1,
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        glowCounty: "glowCounty 5s 2 alternate",
        glowZip: "glowZip 5s 2 alternate",
        glowPermit: "glowPermit 5s 2 alternate",
        bounce: "bounce 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
