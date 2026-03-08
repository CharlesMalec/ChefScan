import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("chefscan.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    prepTime TEXT,
    cookTime TEXT,
    complexity TEXT,
    source TEXT,
    sourceUrl TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/recipes", (req, res) => {
    try {
      const recipes = db.prepare("SELECT * FROM recipes ORDER BY created_at DESC").all();
      // Parse JSON strings back to objects
      const parsedRecipes = recipes.map((r: any) => ({
        ...r,
        ingredients: JSON.parse(r.ingredients),
        steps: JSON.parse(r.steps)
      }));
      res.json(parsedRecipes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.post("/api/recipes", (req, res) => {
    const { id, title, ingredients, steps, prepTime, cookTime, complexity, source, sourceUrl } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO recipes (id, title, ingredients, steps, prepTime, cookTime, complexity, source, sourceUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        title,
        JSON.stringify(ingredients),
        JSON.stringify(steps),
        prepTime,
        cookTime,
        complexity,
        source,
        sourceUrl
      );
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save recipe" });
    }
  });

  app.delete("/api/recipes/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM recipes WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "dist");

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    console.log("Production mode: serving static files from", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      console.log("Serving index.html from", indexPath);
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send(`Build folder (dist) not found at ${indexPath}. Please run 'npm run build' first.`);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
