const mongoose = require("mongoose");
module.exports = mongoose.model("Customer", new mongoose.Schema({
  username:String,
  password:String,
  points:{type:Number, default:0},
  createdAt:{type:Date, default:Date.now}
}));
