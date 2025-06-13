/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Override yellow colors with professional slate/blue variants
        yellow: {
          50: "#f8fafc",   // slate-50 - lightest professional background
          100: "#f1f5f9",  // slate-100 - very light background
          200: "#e2e8f0",  // slate-200 - light border color
          300: "#cbd5e1",  // slate-300 - standard border color
          400: "#94a3b8",  // slate-400 - medium border/text
          500: "#64748b",  // slate-500 - professional text
          600: "#475569",  // slate-600 - darker text/borders
          700: "#334155",  // slate-700 - strong text
          800: "#1e293b",  // slate-800 - very dark text
          900: "#0f172a",  // slate-900 - darkest text/background
        },
        amber: {
          50: "#fef3c7",   // Professional amber-like (yellow-100 alternative)
          100: "#fde68a",  // Light professional warning color
          200: "#fcd34d",  // Medium professional warning color
          300: "#f59e0b",  // Standard professional warning color (amber-500)
          400: "#d97706",  // Darker professional warning color
          500: "#b45309",  // Strong professional warning color
          600: "#92400e",  // Very strong professional warning color
          700: "#78350f",  // Dark professional warning color
          800: "#451a03",  // Very dark professional warning color
          900: "#1c0a00",  // Darkest professional warning color
        },
        // Professional color palette additions
        professional: {
          navy: "#1e40af",      // Professional navy blue
          slate: "#64748b",     // Professional slate gray
          green: "#059669",     // Professional green
          blue: "#3b82f6",      // Professional blue
          orange: "#ea580c",    // Professional orange (warning replacement)
          red: "#dc2626",       // Professional red
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}