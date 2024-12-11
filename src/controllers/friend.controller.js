import friend from "../models/friend.modal.js";
import mongoose from "mongoose";
import { io } from "../utils/socket.js"

export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;

    if(friendId === userId){
      res.status(401).send({message: "you can't be your own friend"});
      return
    }

    const existingRequest = await friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Friend request already sent or exists." });
    }

    const friendRequest = new friend({
      userId,
      friendId,
      senderId: userId,
      status: "pending",
    });

    await friendRequest.save();

    const recipientSocketId = onlineUsers.get(friendId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequest", {
        userId,
        friendId,
        message: "You have a new friend request.",
      });
    }

    res
      .status(201)
      .json({ message: "Friend request sent successfully.", friendRequest });
  } catch (error) {
    res.status(500).json({ message: "Error sending friend request.", error });
  }
};

// Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const friendRequest = await friend.findById(requestId);
    if (!friendRequest || friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Friend request not found or already responded to." });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    const friendship1 = new friend({
      userId: friendRequest.userId,
      friendId: friendRequest.friendId,
      senderId: friendRequest.senderId,
      status: "accepted",
    });

    const friendship2 = new friend({
      userId: friendRequest.friendId,
      friendId: friendRequest.userId,
      senderId: friendRequest.senderId,
      status: "accepted",
    });

    await friendship1.save();
    await friendship2.save();

    const requesterSocketId = onlineUsers.get(friendRequest.userId);
    const acceptorSocketId = onlineUsers.get(friendRequest.friendId);

    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestAccepted", {
        userId: friendRequest.friendId,
        message: "Your friend request was accepted.",
      });
    }

    if (acceptorSocketId) {
      io.to(acceptorSocketId).emit("friendRequestAccepted", {
        userId: friendRequest.userId,
        message: "Friendship confirmed.",
      });
    }

    res.status(200).json({ message: "Friend request accepted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error accepting friend request.", error });
  }
};


export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const friendRequest = await friend.findById(requestId);
    if (!friendRequest || friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Friend request not found or already responded to." });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    const requesterSocketId = onlineUsers.get(friendRequest.userId);
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestRejected", {
        userId: friendRequest.friendId,
        message: "Your friend request was rejected.",
      });
    }

    res.status(200).json({ message: "Friend request rejected.", friendRequest });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting friend request.", error });
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

    res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing friend.", error });
  }
};


export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await friend
      .find({ friendId: userId, status: "pending" })
      .populate("senderId");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching friend requests.", error });
  }
};

export const getFriendList = async (req, res) => {
  try {
      const userId = req.user.id;

      const friends = await friend.find({ userId: userId, status: "accepted" })
          .populate('friendId');

      
      if(friends.length > 0){
        res.status(200).json(friends);
      }
      else{
        res.status(200).json({message: "Friend list empty"})
      }
  } catch (error) {
      res.status(500).json({ message: "Error fetching friend list.", error });
  }
};
