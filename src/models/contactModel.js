const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    timestamps: {type: Date, default: Date.now} 
  },
   
);

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

module.exports = Contact;
