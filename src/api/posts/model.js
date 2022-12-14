import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    text: { type: String, required: true },
    username: { type: String, required: true },
    image: { type: String, required: false },
    user: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: { type: Number, required: true, default: 0}
  },
  {
    timestamps: true,
  }
);

export default model("Post", postSchema);
