import { useState } from "react";

function App() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>🚧 Snap & Fix</h1>
      <p>Report civic issues instantly</p>

      <button
        onClick={() => {
          console.log("Button clicked");
          setShowForm(true);
        }}
        style={{
          padding: "12px 20px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Report an Issue
      </button>

      {showForm && (
        <div style={{ marginTop: "30px", border: "1px solid #ccc", padding: "20px" }}>
          <h3>Upload Issue Photo</h3>
          <input type="file" accept="image/*" />
          <br /><br />
          <button
            style={{
              padding: "10px 16px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Submit Issue
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
