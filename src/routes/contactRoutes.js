const express = require("express");
const User = require("../models/User");
const verifyAccessToken = require("../middleware/authMiddleware");
const Message = require("../models/Message");

const router = express.Router();

const getContacts = async (req, res) => {
  try {
    /** @type {import('express').Request & { user: { id: string } }} */
    (req);
    const currentUserId = req.user.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }

    const users = await User.find({ _id: { $ne: currentUserId } });

      const formatted = await Promise.all(
      users.map(async (u) => {
        const lastMsg = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: u._id },
            { sender: u._id, receiver: currentUserId },
          ],
        })
          .sort({ timestamp: -1 }) // sort latest first
          .limit(1);

        return {
          id: u._id,
          name: u.name,
          phone: u.phoneNumber,
          image: u.image
            ? `${req.protocol}://${req.get("host")}/${u.image.replace(/\\/g, "/")}`
            : null,
          lastMessage: lastMsg ? lastMsg.message : null,
          lastUpdated: lastMsg ? lastMsg.timestamp : null,
        };
      })
    );

    // const formatted = users.map((u) => ({
    //   id: u._id,
    //   name: u.name,
    //   phone: u.phoneNumber,
    //   image: u.image
    //     ? `${req.protocol}://${req.get("host")}/${u.image.replace(/\\/g, "/")}`
    //     : null,
    // }));

      formatted.sort(
      (a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)
    );
     
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contacts" });
  }
};

router.get("/contacts", verifyAccessToken, getContacts);

module.exports = router;
