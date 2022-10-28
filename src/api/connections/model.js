import mongoose from "mongoose";

const { Schema, model } = mongoose;

const connectionSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    pending: { type: Boolean, required: true, default: true },
    accepted: { type: Boolean, required: false },
  },
  {
    timestamps: true,
  }
);

export default model("Connection", connectionSchema);