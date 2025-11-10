const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const messageRoutes = require("./routes/messageRoutes");
const contactRoutes = require("./routes/contactRoutes");
const authRoutes = require("./routes/authRoutes");
const verifyAccessToken = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const allowedOrigins = ["http://localhost:3000", "https://your-netlify-app.netlify.app"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// Message routes
// app.use("/messages", messageRoutes);
app.use("/api", contactRoutes);  
app.use("/api", messageRoutes)
app.use("/api", authRoutes);
app.use("/uploads", express.static("uploads"));

// Root route
app.get("/", (req, res) => {
  res.send("Chat app backend is running 🚀");
});

// Create HTTP and Socket.IO servers
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // When user joins (optional)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // 🔹 Listen for "sendMessage" from frontend
  socket.on("sendMessage", async (data) => {
    try {
      const { sender, receiver, message } = data;

      // Save message to DB
      const newMessage = new Message({ sender, receiver, message });
      await newMessage.save();

      // Emit the message only to sender + receiver
      io.to(sender).to(receiver).emit("receiveMessage", newMessage);
      console.log("✅ Message sent:", newMessage);
    } catch (error) {
      console.error("❌ Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});



// Fetch chat history
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/api/protected", verifyAccessToken, (req, res) => {
  res.json({ message: "You are authorized", userId: req.user.id });
});

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
