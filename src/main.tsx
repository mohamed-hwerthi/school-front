import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { registerServiceWorker, unregisterServiceWorkerAndClearCaches } from "./pwa";

if (import.meta.env.PROD) {
  registerServiceWorker();
} else {
  unregisterServiceWorkerAndClearCaches();
}

createRoot(document.getElementById("root")!).render(<App />);
