import Notification from "../models/notification.modal.js";

export const createNotification = async (req, res) => {
  try {
    const { recipient, sender, type, message } = req.body;

    const notification = new Notification({
      recipient,
      sender,
      type,
      message,
    });

    await notification.save();

    if (global.io) {
      global.io.to(recipient.toString()).emit("new_notification", notification);
    }

    res.status(201).json({ message: "Notification created successfully.", notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to create notification.", error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications.", error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, { read: true });

    res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read.", error: error.message });
  }
};
