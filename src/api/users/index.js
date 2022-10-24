import express from "express";
import createHttpError from "http-errors";
import UsersModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { extname } from "path";

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BEwk4BuildWeek/users",
      public_id: (req, file) => req.params.userId,
    },
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("profile");

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

    const userName =
      req.body.name +
      req.body.surname +
      Math.floor(Math.random() * 100).toString();

    const userData = {
      ...req.body,
      image: avatarUrl,
      username: userName,
    };
    const newUser = new UsersModel(userData);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

// POST USER IMAGE

usersRouter.post(
  "/:userId/image",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const fileName = req.params.userId + extname(req.file.originalname);

      const cloudinaryURL =
        "https://res.cloudinary.com/dlskdxln3/image/upload/BEwk4BuildWeek/users/" +
        fileName;

      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId,
        { image: cloudinaryURL },
        { new: true, runValidators: true }
      );

      if (updatedUser) {
        res.send(updatedUser);
      } else {
        next(
          createHttpError(404, `User with id ${req.params.userId} not found`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET USERS

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
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

export default usersRouter;
