import express from "express";
import createHttpError from "http-errors";
import PostModel from "./model.js";
import UsersModel from "../users/model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import q2m from "query-to-mongo";
import { extname } from "path";

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
    const newPost = new PostModel(req.body);

    const { _id } = await newPost.save();

    res.status(201).send({ _id });
  } catch (error) {
    next(createHttpError(error));
  }
});

// POST IMAGE TO POST

postRouter.post(
  "/:postId/image",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const fileName = req.params.postId + extname(req.file.originalname);

      const cloudinaryURL =
        "https://res.cloudinary.com/dlskdxln3/image/upload/BEwk4BuildWeek/posts/" +
        fileName;

      const updatedPost = await PostModel.findByIdAndUpdate(
        req.params.postId,
        { image: cloudinaryURL },
        { new: true, runValidators: true }
      );

      if (updatedPost) {
        res.send(updatedPost);
      } else {
        next(
          createHttpError(404, `Post with id ${req.params.postId} not found`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET ALL POSTS

postRouter.get("/", async (req, res, next) => {
  try {
    const posts = await PostModel.find().populate({
      path: "user",
      select: "name surname image title company",
    });
    res.send(posts);
  } catch (error) {
    next(error);
  }
});

// GET ALL POSTS PAGINATE

postRouter.get("/paginate", async (req, res, next) => {
  try {
    const mQuery = q2m(req.query);

    const totalPosts = await PostModel.countDocuments(mQuery.criteria);

    const posts = await PostModel.find(mQuery.criteria, mQuery.options.fields)
      .skip(mQuery.options.skip)
      .limit(mQuery.options.limit)
      .sort(mQuery.options.sort)
      .populate({
        path: "user",
        select: "name surname image title company",
      });
    res.send({
      links: mQuery.links("http://localhost:3001/posts", totalPosts),
      totalPosts,
      totalPages: Math.ceil(totalPosts / mQuery.options.limit),
      posts,
    });
  } catch (error) {
    next(error);
  }
});

// GET SPECIFIC POST

postRouter.get("/:postId", async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.postId).populate({
      path: "user",
      select: "name surname image title company",
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
    const updatedPost = await PostModel.findByIdAndUpdate(
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
    const deletePost = await PostModel.findByIdAndDelete(req.params.postId);
    if (deletePost) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `this id: ${req.params.postId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

// LIKE POST

postRouter.get("/:postId/likeToggle/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);

    if (user) {
      const postIndex = user.likedPosts.findIndex(
        (postIdNo) => postIdNo === req.params.postId
      );

      console.log(postIndex);

      if (postIndex !== -1) {
        const updatedPost = await PostModel.findByIdAndUpdate(
          req.params.postId,
          { $inc: { likes: -1 } },
          {
            new: true,
            runValidators: true,
          }
        );

        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.params.userId,
          { $pull: { likedPosts: req.params.postId } },
          { new: true }
        );

        if (updatedUser && updatedPost) {
          res.status(200).send({
            message: "Successfully unliked post",
            userLikedPosts: updatedUser.likedPosts,
          });
        } else {
          next(createHttpError(404, `Could not find post or user`));
        }
      } else {
        const updatedPost = await PostModel.findByIdAndUpdate(
          req.params.postId,
          { $inc: { likes: 1 } },
          {
            new: true,
            runValidators: true,
          }
        );

        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.params.userId,
          { $push: { likedPosts: req.params.postId } },
          { new: true }
        );

        if (updatedUser && updatedPost) {
          res.status(200).send({
            message: "Successfully liked post",
            userLikedPosts: updatedUser.likedPosts,
          });
        } else {
          next(createHttpError(404, `Could not find post or user`));
        }
      }
    } else {
      next(
        createHttpError(404, `user with id: ${req.params.userId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// GET LIKES

postRouter.get("/:postId/likes", async (req, res, next) => {
  try {
    const post = await PostModel.findById(req.params.postId);

    if (post) {
      res.send({
        postLikes: post.likes,
      });
    } else {
      next(
        createHttpError(404, `post with id: ${req.params.postId} not found`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default postRouter;
