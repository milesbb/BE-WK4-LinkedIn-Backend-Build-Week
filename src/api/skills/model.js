import mongoose from "mongoose";

const { Schema, model } = mongoose;

const skillsSchema = new Schema(
  {
    skillName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default model("Skill", skillsSchema);
