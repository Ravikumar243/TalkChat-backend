const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// ✅ GET messages between two users
router.get("/getMessage", async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: "Missing users" });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ POST new message
router.post("/sendMessages", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const now = new Date();
    const options = { weekday: "long" }; // e.g., Monday
    const dayName = now.toLocaleDateString("en-US", options);
    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedDate = now.toLocaleDateString("en-US");

    const newMessage = new Message({
      sender,
      receiver,
      message,
      timestamp: now, 
      day: dayName, 
      time: formattedTime, 
      date: formattedDate,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;
