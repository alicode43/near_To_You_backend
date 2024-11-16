import { Server } from "socket.io";
import mongoose from "mongoose";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js"; // Add this line

const connectedSockets = new Set();

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });
  var count = 0;

  io.on("connect", (socket) => {
    if (connectedSockets.has(socket.id)) {
      console.log(
        `Duplicate connection attempt detected for socket ID: ${socket.id}`
      );
      return;
    }

    connectedSockets.add(socket.id);
    console.log("A user connected ", count++, " ", socket.id);

    // Add more debug logs
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${socket.id} joined room ${userId}`);
    });

    socket.on("send_message", async (message) => {
      const { sender, receiver, content } = message;

      // Extract and load data from the database
      const messageData = {
        sender: new mongoose.Types.ObjectId(sender),
        receiver: new mongoose.Types.ObjectId(receiver),
        content: content,
      };

      // Assuming you have a Message model to save the message to the database
      try {
        const savedMessage = await Message.create(messageData);

        io.to(receiver).emit("receive_message", savedMessage);
        io.to(sender).emit("receive_message", savedMessage);
      } catch (error) {
        console.error("Error saving message to the database:", error);
      }
    });

    socket.on("get_user", async (userId) => {
      console.log("get_user ", userId);
      try {
        userId = new mongoose.Types.ObjectId(userId);
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid userId format");
        }
        console.log("userId", userId);
        const messages = await Message.find({
          $or: [{ sender: userId }, { receiver: userId }],
        }).sort({ timestamp: -1 });

        // Extract unique user IDs (both senders and receivers)
        const userIds = [
          ...new Set(
            messages.flatMap((msg) => [
              msg.sender.toString(),
              msg.receiver.toString(),
            ])
          ),
        ].filter((id) => id !== userId.toString()); // Filter out the same user ID

        // Fetch the names of all users involved in the messages from the User collection
        const users = await User.find({ _id: { $in: userIds } }).select("name");
        console.log("users", users);
        const mapped = users.map((user) => ({ id: user._id, name: user.name }));
        console.log("mapped", mapped);
        console.log(typeof mapped, "  ", typeof users);

        // Return the names to the client
        socket.emit("user_data", mapped);
      } catch (error) {
        console.error("Error retrieving user from the database:", error);
        socket.emit("user_data", { error: "Error retrieving user" });
      }
    });

    socket.on("call_user", (data) => {
      const { userToCall, signalData, from, name } = data;
      io.to(userToCall).emit("call_user", { signal: signalData, from, name });
      console.log(`User ${from} is calling ${userToCall}`);
    });

    socket.on("answer_call", (data) => {
      const { to, signal } = data;
      io.to(to).emit("call_accepted", { signal, from: socket.id });
      console.log(`User ${socket.id} answered call from ${to}`);
    });

    socket.on("ice_candidate", (data) => {
      const { candidate, to } = data;
      io.to(to).emit("ice_candidate", { candidate, from: socket.id });
      console.log(`ICE candidate from ${socket.id} to ${to}`);
    });

    socket.on("end_call", (data) => {
      const { to } = data;
      io.to(to).emit("call_ended", { from: socket.id });
      console.log(`User ${socket.id} ended call with ${to}`);
    });

    socket.on("disconnect", (reason) => {
      if (connectedSockets.has(socket.id)) {
        console.log(`A user disconnected due to ${reason} `, --count);
        connectedSockets.delete(socket.id);
      }
    });
  });

  return io;
};

export default setupSocketIO;
