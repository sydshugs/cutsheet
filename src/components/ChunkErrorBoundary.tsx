import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches lazy-chunk load failures (stale hashes after deploy)
 * and forces a single page reload to fetch the new index.html.
 *
 * Without this, a failed dynamic import() crashes React to a blank screen
 * because there's no error boundary to catch it.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State | null {
    // Detect chunk load failures:
    //   - Vite: "Failed to fetch dynamically imported module"
    //   - Webpack: "Loading chunk N failed"
    //   - Generic: TypeError from import() returning HTML instead of JS
    if (
      error.message?.includes("dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch") ||
      error.name === "ChunkLoadError"
    ) {
      return { hasError: true };
    }
    // Re-throw non-chunk errors so they propagate normally
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error.message?.includes("dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      // Prevent infinite reload loops: only reload once per session
      const key = "chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
    }

    console.error("[ChunkErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#09090b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#a1a1aa",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ fontSize: 16 }}>Something went wrong loading this page.</p>
          <button
            onClick={() => {
              sessionStorage.removeItem("chunk-reload");
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
