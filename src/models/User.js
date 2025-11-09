const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: {type: String, require : true},
  phoneNumber: { type: String, required: true, unique: true },
  password : {type: String, require : true},
  refreshToken : {type : String},
  image: { type: String } 
})


module.exports = mongoose.model("User",userSchema)