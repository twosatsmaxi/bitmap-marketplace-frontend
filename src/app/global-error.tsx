"use client";

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#e4e4e7",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              color: "#f7931a",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            FATAL
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Critical Error
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              opacity: 0.6,
              marginBottom: "2rem",
              maxWidth: "24rem",
            }}
          >
            The application encountered a critical failure. Please reload the
            page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              border: "1px solid #f7931a",
              background: "rgba(247, 147, 26, 0.1)",
              color: "#f7931a",
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "0px",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
