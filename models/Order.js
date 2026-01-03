const mongoose = require("mongoose");
module.exports = mongoose.model("Order", new mongoose.Schema({
  customerName:String,
  customerPhone:String,
  items:Array,
  total:Number,
  paymentMethod:String,
  pickupTime:String,
  status:{type:String, default:"pending"},
  createdAt:{type:Date, default:Date.now}
}));
