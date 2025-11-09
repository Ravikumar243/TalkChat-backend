const express = require("express")
const {registerUser,upload, loginUser, refreshToken, logoutUser} = require("../controllers/authController")

const router = express.Router();


router.post("/register",upload, registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);

module.exports = router;