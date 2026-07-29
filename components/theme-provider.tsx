"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "nexus-theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Runs before paint, so the correct theme class is on <html> for the very first
 * frame. Without this the page flashes light before hydration.
 *
 * The fallback must be the same `defaultTheme` the provider uses. When the two
 * disagree — script falling back to "system", provider to "dark" — a first-time
 * visitor on a light-mode OS gets painted light and then snapped to dark once
 * the effect runs, which is the exact flash this script exists to prevent.
 */
const noFlashScript = (defaultTheme: Theme) => `(function(){try{
var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||${JSON.stringify(defaultTheme)};
var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark",d);
document.documentElement.style.colorScheme=d?"dark":"light";
}catch(e){}})();`;

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<Resolved>("dark");

  const apply = React.useCallback((next: Theme) => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const dark = next === "dark" || (next === "system" && media.matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    setResolvedTheme(dark ? "dark" : "light");
  }, []);

  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
    setThemeState(stored);
    apply(stored);
  }, [apply, defaultTheme]);

  // Follow the OS only while the user has explicitly chosen "system".
  React.useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, apply]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next);
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    },
    [apply]
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <script dangerouslySetInnerHTML={{ __html: noFlashScript(defaultTheme) }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
