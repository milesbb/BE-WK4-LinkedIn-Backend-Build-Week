import express from "express";
import createHttpError from "http-errors";
import UsersModel from "../users/model.js";
import ConnectionsModel from "./model.js";

const connectionsRouter = express.Router();

// GET USER CONNECTIONS

connectionsRouter.get("/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId).populate([
      {
        path: "connections",
        select: "name surname image",
      },
      {
        path: "sentRequests",
        populate: {
          path: "senderId recipientId",
          select: "name surname image",
        },
      },
      {
        path: "receivedRequests",
        populate: {
          path: "senderId recipientId",
          select: "name surname image",
        },
      },
    ]);

    res.status(200).send({
      yourName: user.name + " " + user.surname,
      yourConnections: user.connections,
      yourConnectionRequests: user.sentRequests,
      yourReceivedConnectionRequests: user.receivedRequests,
    });
  } catch (error) {
    next(error);
  }
});

// CONNECT REQUEST

connectionsRouter.post("/:senderId/:receiverId", async (req, res, next) => {
  try {
    const testFindConnection = await ConnectionsModel.findOne({
      $or: [
        {
          $and: [
            { senderId: req.params.senderId },
            { recipientId: req.params.receiverId },
          ],
        },
        {
          $and: [
            { senderId: req.params.receiverId },
            { recipientId: req.params.senderId },
          ],
        },
      ],
    });

    if (testFindConnection) {
      next(
        createHttpError(
          409,
          `Connection request between user ${req.params.senderId} and ${req.params.receiverId} already exists at ID ${testFindConnection._id}`
        )
      );
    } else {
      const newConnect = new ConnectionsModel({
        senderId: req.params.senderId,
        recipientId: req.params.receiverId,
        pending: true,
      });

      const { _id } = await newConnect.save();

      const sendingUser = await UsersModel.findByIdAndUpdate(
        req.params.senderId,
        { $push: { sentRequests: _id } },
        { new: true, runValidators: true }
      );

      if (sendingUser) {
        const receivingUser = await UsersModel.findByIdAndUpdate(
          req.params.receiverId,
          { $push: { receivedRequests: _id } },
          { new: true, runValidators: true }
        );

        if (receivingUser) {
          res.status(201).send({
            message: "Connection request sent successfully",
            connectionRequestId: _id,
          });
        } else {
          next(
            createHttpError(
              404,
              `Could not find receiving user with id ${req.params.receiverId}`
            )
          );
        }
      } else {
        next(
          createHttpError(
            404,
            `Could not find requesting user with id ${req.params.senderId}`
          )
        );
      }
    }
  } catch (error) {
    next(error);
  }
});

// ACCEPT CONNECT REQUEST

connectionsRouter.get("/:requestId/accept", async (req, res, next) => {
  try {
    const updatedConnect = await ConnectionsModel.findByIdAndUpdate(
      req.params.requestId,
      {
        pending: false,
        accepted: true,
      },
      { new: true, runValidators: true }
    );

    if (updatedConnect) {
      const requestingUser = await UsersModel.findByIdAndUpdate(
        updatedConnect.senderId,
        {
          $push: { connections: updatedConnect.recipientId },
          $pull: { sentRequests: updatedConnect._id },
        },
        { new: true, runValidators: true }
      );

      if (requestingUser) {
        const receivingUser = await UsersModel.findByIdAndUpdate(
          updatedConnect.recipientId,
          {
            $push: { connections: updatedConnect.senderId },
            $pull: { receivedRequests: updatedConnect._id },
          },
          { new: true, runValidators: true }
        );

        if (receivingUser) {
          const deletedConnect = await ConnectionsModel.findByIdAndDelete(
            updatedConnect._id
          );

          res.status(200).send({
            message: "Connection accepted",
            requestingUserConnections: requestingUser.connections,
            receivingUserConnections: receivingUser.connections,
          });
        } else {
          next(
            createHttpError(
              404,
              `Could not find receiving user with id ${updatedConnect.recipientId}`
            )
          );
        }
      } else {
        next(
          createHttpError(
            404,
            `Could not find requesting user with id ${updatedConnect.senderId}`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Could not find connect request with id ${req.params.requestId}`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

// REFUSE CONNECT REQUEST

connectionsRouter.get("/:requestId/refuse", async (req, res, next) => {
  try {
    const updatedConnect = await ConnectionsModel.findByIdAndUpdate(
      req.params.requestId,
      {
        pending: false,
        accepted: false,
      },
      { new: true, runValidators: true }
    );

    const connectId = updatedConnect._id;
    const connectSendUserId = updatedConnect.senderId;
    const connectReceiveUserId = updatedConnect.recipientId;

    if (updatedConnect) {
      const requestingUser = await UsersModel.findByIdAndUpdate(
        connectSendUserId,
        {
          $pull: { sentRequests: connectId },
        },
        { new: true, runValidators: true }
      );

      if (requestingUser) {
        const receivingUser = await UsersModel.findByIdAndUpdate(
          connectReceiveUserId,
          {
            $pull: { receivedRequests: connectId },
          },
          { new: true, runValidators: true }
        );

        if (receivingUser) {
          const deletedConnect = await ConnectionsModel.findByIdAndDelete(
            connectId
          );

          res.status(200).send({
            message: "Connection refused",
            requestingUserConnections: requestingUser.connections,
            receivingUserConnections: receivingUser.connections,
          });
        } else {
          next(
            createHttpError(
              404,
              `Could not find receiving user with id ${updatedConnect.recipientId}`
            )
          );
        }
      } else {
        next(
          createHttpError(
            404,
            `Could not find requesting user with id ${updatedConnect.senderId}`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Could not find connect request with id ${req.params.requestId}`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

// REMOVE CONNECTION

connectionsRouter.delete("/:senderId/:receiverId", async (req, res, next) => {
  try {
    const updatedRequestingUser = await UsersModel.findByIdAndUpdate(
      req.params.senderId,
      { $pull: { connections: req.params.receiverId } },
      { new: true, runValidators: true }
    );

    if (updatedRequestingUser) {
      const updatedReceivingUser = await UsersModel.findByIdAndUpdate(
        req.params.receiverId,
        { $pull: { connections: req.params.senderId } },
        { new: true, runValidators: true }
      );

      if (updatedReceivingUser) {
        res.status(200).send({
          message: "Connection removed",
          requestingUserConnections: updatedRequestingUser.connections,
          receivingUserConnections: updatedReceivingUser.connections,
        });
      } else {
        next(
          createHttpError(
            404,
            `Could not find receiving user with id ${req.params.receiverId}`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Could not find requesting user with id ${req.params}`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

export default connectionsRouter;
