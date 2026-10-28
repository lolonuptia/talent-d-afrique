import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { initSpec } from "./api";
import "./index.css";
import "./pages4.css";
import "./polish.css";
import "./pages.css";
import "./pages2.css";
import { Toaster } from "sonner";
import { initResponsiveTables } from "./responsive";
document.documentElement.dataset.theme = localStorage.getItem("theme") || "light";

initResponsiveTables();

initSpec().finally(() => createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
));
