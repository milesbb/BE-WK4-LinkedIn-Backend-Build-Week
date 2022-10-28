import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import {
  badRequestHandler,
  conflictHandler,
  genericServerErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers.js";
import usersRouter from "./api/users/index.js";
import postRouter from "./api/posts/index.js";
import skillsRouter from "./api/skills/index.js"
import connectionsRouter from "./api/connections/index.js";

const server = express();
const port = process.env.PORT || 3001;

server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

server.use(express.json());

server.use("/users", usersRouter);
server.use("/posts", postRouter);
server.use("/skills", skillsRouter);
server.use("/connections", connectionsRouter)

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(conflictHandler);
server.use(genericServerErrorHandler);

mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);

server.listen(port, () => {
  console.table(listEndpoints(server));
  console.log("Server is up and running on port " + port);
});
