import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initColorOverride } from "./lib/colorOverride";

// Initialize the color override system to eliminate yellow colors
initColorOverride();

createRoot(document.getElementById("root")).render(<App />);
