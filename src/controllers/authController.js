const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where images will be saved
  },
  filename: (req, file, cb) => {
    // Get name from frontend (req.body.name)
    const nameFromFrontend = req.body.name ? req.body.name.replace(/\s+/g, "_") : "user";
    const timestamp = Date.now();
    const fileExtension = file.originalname.split(".").pop(); // get extension
    cb(null, `${nameFromFrontend}-${timestamp}.${fileExtension}`);
  },
});

const upload = multer({ storage });

exports.registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, password } = req.body;
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser)
      return res.status(400).json({ message: "user already exists" });

    const hashedpassword = await bcrypt.hash(password, 10);
    const user = new User({ name, phoneNumber, password: hashedpassword, image: req.file ? req.file.path : null, });

    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  console.log("Request body:", req.body);
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user._id }, ACCESS_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, {
      expiresIn: "30d",
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken,
        userId: user._id,
        name: user.name,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
      if (err)
        return res
          .status(403)
          .json({ message: "Expired or invalid refresh token" });

      const newAccessToken = jwt.sign({ id: decoded.id }, ACCESS_SECRET, {
        expiresIn: "1h",
      });
      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout
exports.logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.upload = upload.single("image");
