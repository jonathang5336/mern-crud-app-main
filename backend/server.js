// MERN Backend Service for Vercel Deployment
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(morgan("dev"));

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

// MongoDB Connection Caching for Serverless Execution
let isConnected = false;

async function connectToDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (!mongoUri) {
    console.warn("Warning: MONGO_URI is not set in environment variables.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, { dbName });
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
}

// Connect immediately on startup if possible
connectToDatabase().catch((err) => console.error("Initial DB connection attempt:", err.message));

// Middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  // Allow health check without DB connection
  if (req.path === "/" || req.path === "/api/health" || req.path === "/health") {
    return next();
  }

  try {
    await connectToDatabase();
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Database connection failed. Please verify MONGO_URI in your environment variables.",
      error: error.message,
    });
  }
});

// Define the Post schema and model
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
});
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// CRUD operations router for Blog Posts
const postRouter = express.Router();

// Create a new post
postRouter.post("/", async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json({ message: "Post created successfully", data: post });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
});

// Read all posts
postRouter.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res
      .status(200)
      .json({ message: "Posts retrieved successfully", data: posts });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
});

// Read post by id
postRouter.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res
      .status(200)
      .json({ message: "Post retrieved successfully", data: post });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
});

// Update post by id
postRouter.put("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post updated successfully", data: post });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
});

// Delete post by id
postRouter.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully", data: post });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
});

// Mount router on multiple prefix variants so it works regardless of Vercel path rewrites
app.use("/api/v1/posts", postRouter);
app.use("/v1/posts", postRouter);
app.use("/api/posts", postRouter);
app.use("/posts", postRouter);

// Health check routes
const healthHandler = (req, res) => {
  res.json({
    status: "ok",
    dbConnected: mongoose.connection.readyState === 1,
  });
};

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Express API" });
});

// JSON 404 Fallback to guarantee no HTML error pages from backend
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start the server (binds to process.env.PORT on Vercel runtime and local port)
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Export default app for Vercel Serverless Function entrypoint
export default app;
