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
          50: "#f8fafc",   // slate-50
          100: "#f1f5f9",  // slate-100
          200: "#e2e8f0",  // slate-200
          300: "#cbd5e1",  // slate-300
          400: "#94a3b8",  // slate-400
          500: "#64748b",  // slate-500
          600: "#475569",  // slate-600
          700: "#334155",  // slate-700
          800: "#1e293b",  // slate-800
          900: "#0f172a",  // slate-900
        },
        amber: {
          50: "#f8fafc",   // slate-50
          100: "#f1f5f9",  // slate-100
          200: "#e2e8f0",  // slate-200
          300: "#cbd5e1",  // slate-300
          400: "#94a3b8",  // slate-400
          500: "#64748b",  // slate-500
          600: "#475569",  // slate-600
          700: "#334155",  // slate-700
          800: "#1e293b",  // slate-800
          900: "#0f172a",  // slate-900
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}