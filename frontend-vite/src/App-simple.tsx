import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>✅ React App is Working!</h1>
      <p>If you can see this, your Vite setup is correct.</p>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <strong>Frontend Status:</strong> ✅ Running
      </div>
      <div style={{ backgroundColor: '#ffe6e6', padding: '10px', margin: '10px 0' }}>
        <strong>Backend Status:</strong> ❌ Not connected (this is normal for now)
      </div>
    </div>
  );
}

export default App;