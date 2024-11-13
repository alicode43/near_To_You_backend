import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import mongoose from 'mongoose';
import {ApiResponse} from '../utils/ApiResponse.js';
const sendMessage = async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    // Validate sender and receiver
    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);

    if (!senderUser || !receiverUser) {
      throw new ApiError(400, 'Invalid sender or receiver');
    }

    // Create the message
    // const message = await Message.create({
    //   sender,
    //   receiver,
    //   content,
    // });

    // res.status(201).json(message);
    return res
    .status(200)
    .json(new ApiResponse(200, "Message Send  successfully"));
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

const getMessages = async (req, res) => {
  const { receiverId } = req.params;
  console.log('receiverId', receiverId);
  try {
    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(receiverId);
    // console.log('reciveer', userObjectId, " sender ",req.user._id);

    // Ensure req.user._id is available
    if (!req.user || !req.user._id) {
      throw new ApiError(400, 'User not authenticated');
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userObjectId },
        { sender: userObjectId, receiver: req.user._id }
      ]
    }).sort({ timestamp: 1 });

    // console.log('get messages: ', messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};

const test = async (req, res) => {
  res.status(200).json({ message: "message controller test route" });
};

export { sendMessage, getMessages, test };