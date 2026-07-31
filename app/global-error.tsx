"use client";

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * whole document, so it must ship its own <html>/<body> and cannot rely on the
 * theme provider or the token stylesheet having loaded — hence the inline
 * styles rather than utility classes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0c1513",
          color: "#e7efec",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            The application failed to start
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, color: "#9db3ac" }}>
            This is an unexpected fault in the app shell rather than in a single
            page. Reloading usually clears it.
          </p>
          <button
            onClick={reset}
            style={{
              border: "1px solid #2f4a43",
              background: "#16c79a",
              color: "#04211b",
              borderRadius: "0.5rem",
              padding: "0.6rem 1.1rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload the application
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "#7d8f89" }}>
              Reference <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
