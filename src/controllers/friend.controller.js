import friend from "../models/friend.modal.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    const existingRequest = await friend.findOne({ userId, friendId });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Friend request already sent or exists." });
    }

    const friendRequest = new friend({
      userId,
      friendId,
      status: "pending",
    });

    await friendRequest.save();
    res
      .status(201)
      .json({ message: "Friend request sent successfully.", friendRequest });
  } catch (error) {
    res.status(500).json({ message: "Error sending friend request.", error });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const friendRequest = await friend.findById(requestId);

    if (!friendRequest || friendRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Friend request not found or already responded to." });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    res
      .status(200)
      .json({ message: "Friend request accepted.", friendRequest });
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

    res
      .status(200)
      .json({ message: "Friend request rejected.", friendRequest });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting friend request.", error });
  }
};
