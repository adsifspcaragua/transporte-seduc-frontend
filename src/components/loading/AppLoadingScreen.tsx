export function AppLoadingScreen() {
  return (
    <output
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-brand-600"
      style={{
        alignItems: "center",
        backgroundColor: "#084e80",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
      }}
    >
      <style>
        {"@keyframes app-loading-spin { to { transform: rotate(360deg); } }"}
      </style>
      <span
        aria-hidden="true"
        className="size-12 animate-spin rounded-full border-4 border-white/30 border-t-white"
        style={{
          animation: "app-loading-spin 0.8s linear infinite",
          border: "4px solid rgb(255 255 255 / 0.3)",
          borderRadius: "9999px",
          borderTopColor: "#ffffff",
          height: "48px",
          width: "48px",
        }}
      />
      <span className="sr-only">Carregando sistema</span>
    </output>
  );
}
