import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

import GlobalErrorBoundary from "./components/GlobalErrorBoundary.tsx";

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Failed to find the root element");

    createRoot(rootElement).render(
        <GlobalErrorBoundary>
            <App />
        </GlobalErrorBoundary>
    );
} catch (e: any) {
    document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red;">
      <h2>CRITICAL INITIALIZATION ERROR:</h2>
      <pre>${e?.message || String(e)}</pre>
      <pre>${e?.stack || ''}</pre>
    </div>
  `;
}
