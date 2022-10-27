import express from "express";
import createHttpError from "http-errors";
import UsersModel from "../users/model.js";
import SkillsModel from "./model.js";

const skillsRouter = express.Router();

// =========================== SKILLS ===========================

// CREATE SKILL

skillsRouter.post("/", async (req, res, next) => {
  try {
    const newSkill = new SkillsModel(req.body);

    const { _id } = await newSkill.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(createHttpError(error));
  }
});

// GET ALL POSSIBLE SKILLS

skillsRouter.get("/", async (req, res, next) => {
  try {
    const skills = await SkillsModel.find();

    if (skills) {
      res.status(200).send(skills);
    } else {
      next(createHttpError(404, "No skills found"));
    }
  } catch (error) {
    next(error);
  }
});

// ADD SKILL(S) TO USER

skillsRouter.put("/:userId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId,
      {
        $push: { skills: { $each: req.body.skills } },
      },
      { new: true, runValidators: true }
    );

    if (updatedUser) {
      res.status(200).send(updatedUser.skills);
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// GET USER SKILL(S)

skillsRouter.get("/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId).populate({
      path: "skills",
      select: "skillName _id",
    });

    if (user) {
      res.status(200).send(user.skills);
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// REMOVE SKILL

skillsRouter.delete("/:userId/remove/:skillId", async (req, res, next) => {
  try {
    const user = await UsersModel.findByIdAndUpdate(
      req.params.userId,
      { $pull: { skills: req.params.skillId } },
      { new: true }
    );

    if (user) {
      res.send();
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default skillsRouter;
