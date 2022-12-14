import express from "express";
import createHttpError from "http-errors";
import UsersModel from "./model.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { extname } from "path";
import createCVPdf from "../../lib/pdf-tools.js";
import { pipeline, Readable } from "stream";
import { Transform } from "json2csv";

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

const experienceCloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BEwk4BuildWeek/experiences",
      public_id: (req, file) => req.params.experienceId,
    },
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("experience");

const usersRouter = express.Router();

// =========================== USERS ===========================

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
      console.log("Image upload attempt", req.file.path)

      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId,
        { image: req.file.path },
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

// =========================== EXPERIENCES ===========================

// POST EXPERIENCE

usersRouter.post("/:userId/experiences", async (req, res, next) => {
  try {
    const experienceData = {
      ...req.body,
      image:
        "https://res.cloudinary.com/dlskdxln3/image/upload/v1666605332/BEwk4BuildWeek/user-icon_pwk4kh.jpg",
    };

    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId,
      { $push: { experiences: experienceData } },
      { new: true, runValidators: true }
    );

    if (updatedUser) {
      res.status(200).send(updatedUser);
    } else {
      next(
        createHttpError(404, `User with id ${req.params.userId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

// POST EXPERIENCE IMAGE

usersRouter.post(
  "/:userId/experiences/:experienceId/image",
  experienceCloudinaryUploader,
  async (req, res, next) => {
    try {
      const user = await UsersModel.findById(req.params.userId);

      if (user) {
        const selectedExperienceIndex = user.experiences.findIndex(
          (experience) => experience._id.toString() === req.params.experienceId
        );

        if (selectedExperienceIndex !== -1) {
          user.experiences[selectedExperienceIndex].image = req.file.path;

          await user.save({ validateBeforeSave: false });

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

// GET EXPERIENCES

usersRouter.get("/:userId/experiences", async (req, res, next) => {
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

// GET SPECIFIC EXPERIENCE

usersRouter.get(
  "/:userId/experiences/:experienceId",
  async (req, res, next) => {
    try {
      const user = await UsersModel.findById(req.params.userId);

      if (user) {
        const selectedExperience = user.experiences.find(
          (experience) => experience._id.toString() === req.params.experienceId
        );

        if (selectedExperience) {
          res.status(200).send(selectedExperience);
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

// PUT EXPERIENCE

usersRouter.put(
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

// DELETE EXPERIENCE

usersRouter.delete(
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

// =========================== PDF AND CSV ===========================

// PDF

usersRouter.get("/:userId/cv", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);

    res.setHeader("Content-Disposition", `attachment; filename=CV.pdf`);

    await createCVPdf(req.params.userId, user, res);
  } catch (error) {
    next(error);
  }
});

// CSV

usersRouter.get("/:userId/csv", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId);

    const { experiences } = user;

    if (experiences) {
      const jsonExperiences = JSON.stringify(experiences);

      const transformOpts = { highWaterMark: 16384, encoding: "utf-8" };

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=experiences.csv"
      );

      const opts = { experiences };

      const source = new Readable({
        read(size) {
          this.push(jsonExperiences);
          this.push(null);
        },
      });

      const transform = new Transform(opts, transformOpts);
      const destination = res;

      pipeline(source, transform, destination, (error) => {
        if (error) console.log(error);
      });
    } else {
      next(
        createHttpError(
          404,
          `User with id ${req.params.userId} has not added any experiences!`
        )
      );
    }
  } catch (error) {}
});

export default usersRouter;
