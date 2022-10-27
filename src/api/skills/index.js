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

// ADD SKILL(S) TO USER

skillsRouter.put(
    "/:userId/experiences/:experienceId",
    async (req, res, next) => {
      try {
        const user = await UsersModel.findById(req.params.userId);
  
        if (user) {
          const selectedExperienceIndex = user.experiences.findIndex(
            (experience) => experience._id.toString() === req.params.experienceId
          );
  
          if (selectedExperienceIndex !== -1) {
            user.experiences[selectedExperienceIndex] = {
              ...user.experiences[selectedExperienceIndex],
              ...req.body,
              _id: req.params.experienceId,
            };
  
            await user.save();
  
            res.status(200).send(user);
          } else {
            next(
              createHttpError(
                404,
                `Experience with id ${req.params.experienceId} not found!`
              )
            );
          }
        } else {
          next(
            createHttpError(404, `User with id ${req.params.userId} not found!`)
          );
        }
      } catch (error) {
        next(error);
      }
    }
  );

// GET USER SKILL(S)

skillsRouter.get("/:userId/skills", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);

    if (user) {
      res.status(200).send(user.experiences);
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

skillsRouter.delete(
  "/:userId/experiences/:experienceId",
  async (req, res, next) => {
    try {
      const user = await UsersModel.findByIdAndUpdate(
        req.params.userId,
        { $pull: { experiences: { _id: req.params.experienceId } } },
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
  }
);

export default skillsRouter;
