const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const uploadFile = require('./services/storage.service');
const postModel = require('./models/post.model');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
// DEPLOY STEP: Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    process.env.FRONTEND_URL  // Set this in Render env vars → e.g. https://instagram-clone-xyz.vercel.app
].filter(Boolean);

app.use(cors({ 
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth routes
app.use("/auth", authRoutes);

// Upload setup
const upload = multer({ storage: multer.memoryStorage() });

// Create Post
app.post("/create-post", upload.single("image"), async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        console.log("Request File:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const result = await uploadFile(req.file.buffer);
        console.log("Upload Result:", result);

        const post = await postModel.create({
            image: result.url,
            caption: req.body.caption
        });

        res.status(201).json({
            message: "Post created successfully",
            post
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get All Posts
app.get("/posts", async (req, res) => {
    try {
        const posts = await postModel.find();
        res.status(200).json({
            message: "Posts fetched successfully",
            posts
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: error.message });
    }
});

// Health check / catch-all
app.get("/", (req, res) => {
    res.json({ message: "Instagram Clone API is running 🚀" });
});

module.exports = app;