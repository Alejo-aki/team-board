import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Team Board</h1>
      <p>Frontend base funcionando correctamente.</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
