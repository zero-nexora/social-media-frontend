import { createRoot } from "react-dom/client";
import "quill/dist/quill.snow.css";
import "./styles/quill-overrides.css";
import "./index.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(<App />);
