const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  // sender: {type:String,required: true  },
  // receiver : {type: String, required : true},
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  day: { type: String },
  time: { type: String },
  date: { type: String },
});

module.exports =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
