import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: { type: String, enum: ["FRIEND_REQUEST", "FRIEND_ACCEPTED", "FRIEND_REJECT"], required: true },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification