import express from "express";
import createHttpError from "http-errors";
import postModel from "./postModel.js";

const postRouter = express.Router()

postRouter.post("/",async(req,res,next)=>{
    try{
        const newPost = new postModel(req.body)

        const {_id} = await newPost.save()

        res.status(201).send({_id})


    } catch(error){
        next(createHttpError(error))
    }
})

postRouter.get("/",async(req,res,next)=>{
    try{
        const posts = await postModel.find()
        res.send(posts)
    } catch(error){
        next(error)
    }
})

postRouter.get("/:postId",async(req,res,next)=>{
    try{
        const post = await postModel.findById(req.params.postId)
        if(post){
            res.send(post)
        } else{
            next(createHttpError(404,`the post with Id : ${req.params.postId} not found`))
        }
    } catch(error){
        next(createHttpError(error))
    }
})

postRouter.put("/:postId",async(req,res,next)=>{
    try{
        const updatedPost = await postModel.findByIdAndUpdate(
            req.params.postId,
            req.body,{
            new: true, runValidators: true
        })
        if(updatedPost){
            res.send(updatedPost)
        } else{
            next(createHttpError())
        }
    } catch(error){
        next(error)
    }
})

postRouter.delete("/:postId",async(req,res,next)=>{
    try{
        const deletePost = await postModel.findByIdAndDelete(req.params.postId)
        if(deletePost){
            res.status(204).send()
        } else{
            next(createHttpError(404, `this id: ${req.params.postId} not found`))
        }
    } catch(error){
        next(error)
    }
})


export default postRouter