import friend from "../models/friend.modal.js";
import mongoose from "mongoose";
import { io, onlineUsers } from "../utils/socket.js"; 
import Notification from "../models/notification.modal.js";
import Friend from "../models/friend.modal.js";

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;

    if (friendId === userId) {
      return res.status(400).json({ message: "You can't be your own friend." });
    }

    const existingRequest = await friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent or friendship exists." });
    }

    const friendRequest = new friend({
      userId,
      friendId,
      senderId: userId,
      status: "pending",
    });

    await friendRequest.save();

    const recipientSocketId = onlineUsers.get(friendId);

    // Notification should be saved with recipient's user ID, not socket ID
    const notification = await Notification.create({
      recipient: friendId, // Correct recipient ID
      sender: req.user._id,
      type: "FRIEND_REQUEST",
      message: `${req.user.username} sent you a friend request.`,
    });

    // Emit real-time notification to recipient via Socket.IO
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_notification", notification);
    }

    return res.status(201).json({ message: "Friend request sent successfully.", friendRequest });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ message: "Error sending friend request.", error });
  }
};



// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Friend.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (request.friendId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action." });
    }

    // Update the request status to accepted
    request.status = "accepted";
    await request.save();

    // Add the friend to both users' friend lists
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { friends: request.senderId },
    });

    await User.findByIdAndUpdate(request.senderId, {
      $addToSet: { friends: req.user._id },
    });

    // Create a notification for the sender
    const notification = await Notification.create({
      recipient: request.senderId, // Sender should receive the notification
      sender: req.user._id,
      type: "FRIEND_ACCEPTED",
      message: `${req.user.username} accepted your friend request.`,
    });

    // Emit notification to the sender via Socket.IO
    const senderSocketId = onlineUsers.get(request.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("new_notification", notification);
    }

    res.status(200).json({ message: "Friend request accepted.", notification });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ message: "Failed to accept friend request.", error: error.message });
  }
};

// Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const friendRequest = await friend.findById(requestId);
    if (!friendRequest || friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Friend request not found or already responded to." });
    }

    // Update the request status to rejected
    friendRequest.status = "rejected";
    await friendRequest.save();

    // Emit rejection notification to the requester
    const requesterSocketId = onlineUsers.get(friendRequest.senderId); // Use senderId, not userId
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestRejected", {
        userId: friendRequest.senderId, // Correct sender ID
        message: "Your friend request was rejected.",
      });
    }

    return res.status(200).json({ message: "Friend request rejected." });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return res.status(500).json({ message: "Error rejecting friend request.", error });
  }
};



// Remove Friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;

    await friend.deleteOne({ userId, friendId });
    await friend.deleteOne({ userId: friendId, friendId: userId });

    const recipientSocketId = onlineUsers.get(friendId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRemoved", {
        userId,
        message: "You have been removed as a friend.",
      });
    }

    return res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({ message: "Error removing friend.", error });
  }
};

// Get Friend Requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await friend
      .find({ friendId: userId, status: "pending" })
      .populate("senderId", "username");

    return res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return res.status(500).json({ message: "Error fetching friend requests.", error });
  }
};

// Get Friend List
export const getFriendList = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await friend
      .find({ userId, status: "accepted" })
      .populate("friendId", "username");

    return res.status(200).json(friends.length > 0 ? friends : []);
  } catch (error) {
    console.error("Error fetching friend list:", error);
    return res.status(500).json({ message: "Error fetching friend list.", error });
  }
};
