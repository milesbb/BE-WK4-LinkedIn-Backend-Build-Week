import express from "express";
import createHttpError from "http-errors";
import postModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BEwk4BuildWeek/posts",
      public_id: (req, file) => req.params.postId,
    },
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("post");

const postRouter = express.Router();

// POST POST

postRouter.post("/", async (req, res, next) => {
  try {
    const newPost = new postModel(req.body);

    const { _id } = await newPost.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(createHttpError(error));
  }
});

// POST IMAGE TO POST

// GET ALL POSTS

postRouter.get("/", async (req, res, next) => {
  try {
    const posts = await postModel.find().populate({
      path: "user",
      select: "name surname image",
    });
    res.send(posts);
  } catch (error) {
    next(error);
  }
});

// GET ALL POSTS PAGINATE

// GET SPECIFIC POST

postRouter.get("/:postId", async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.postId).populate({
      path: "user",
      select: "name surname image",
    });
    if (post) {
      res.send(post);
    } else {
      next(
        createHttpError(
          404,
          `the post with Id : ${req.params.postId} not found`
        )
      );
    }
  } catch (error) {
    next(createHttpError(error));
  }
});

// EDIT POST

postRouter.put("/:postId", async (req, res, next) => {
  try {
    const updatedPost = await postModel.findByIdAndUpdate(
      req.params.postId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (updatedPost) {
      res.send(updatedPost);
    } else {
      next(
        createHttpError(
          404,
          `the post with Id : ${req.params.postId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

// DELETE POST

postRouter.delete("/:postId", async (req, res, next) => {
  try {
    const deletePost = await postModel.findByIdAndDelete(req.params.postId);
    if (deletePost) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `this id: ${req.params.postId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

export default postRouter;
