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
  if (req.path === "/" || req.path === "/api/health") {
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

// CRUD operations for Blog Posts
// Create a new post
app.post("/api/v1/posts", async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).send({ message: "Post created successfully", data: post });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Read all posts
app.get("/api/v1/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    res
      .status(200)
      .send({ message: "Posts retrieved successfully", data: posts });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Read post by id
app.get("/api/v1/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res
      .status(200)
      .send({ message: "Post retrieved successfully", data: post });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Update post by id
app.put("/api/v1/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.status(200).send({ message: "Post updated successfully", data: post });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Delete post by id
app.delete("/api/v1/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.status(200).send({ message: "Post deleted successfully", data: post });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Test / Health check routes
app.get("/", (req, res) => {
  res.send({ message: "Welcome to Express API" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Start the server only in local development (when not running in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

// Export default app for Vercel Serverless Function entrypoint
export default app;
