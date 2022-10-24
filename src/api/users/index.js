import express from "express";
import { request } from "http";
import createHttpError from "http-errors";
import UsersModel from "./model.js";

const usersRouter = express.Router();

// USERS

// POST USER

usersRouter.post("/", async (req, res, next) => {
  try {
    const avatarUrl =
    "https://ui-avatars.com/api/?name=" +
    req.body.name +
    "+" +
    req.body.surname;

    const userName = req.body.name + req.body.surname + (Math.floor(Math.random() * 100)).toString()

    const userData = {
        ...req.body,
        image: avatarUrl,
        username: userName
    }
    const newUser = new UsersModel(userData);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// GET USERS

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find()
    res.send(users);
  } catch (error) {
    next(error);
  }
});

// GET 'me'

usersRouter.get("/me", async (req, res, next) => {
    try {
      const user = await UsersModel.findById(process.env.MY_ID);
      if (user) {
        res.send(user);
      } else {
        next(createHttpError(404, `User with id ${req.params.userId} not found`));
      }
    } catch (error) {
      next(error);
    }
  });

// GET SPECIFIC USER

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);
    if (user) {
      res.send(user);
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

// EDIT USER

usersRouter.put("/:userId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

// DELETE USER

usersRouter.delete("/:userId", async (req, res, next) => {
  try {
    const deletedUser = await UsersModel.findByIdAndDelete(req.params.userId);
    if (deletedUser) {
      res.status(204).send();
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default usersRouter