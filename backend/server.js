// server.js
import express from "express";

const app = express();
const PORT = 3000;

// Middleware để parse JSON
app.use(express.json());

// Route test
app.get("/", (req, res) => {
  res.send("Hello backend 👋");
});

// Server listen
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
