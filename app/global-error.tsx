"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>{error.digest ? `Ref: ${error.digest}` : "Please reload the page."}</p>
          <button onClick={reset}>Reload</button>
        </div>
      </body>
    </html>
  );
}
