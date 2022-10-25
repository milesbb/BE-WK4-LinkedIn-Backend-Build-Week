import mongoose from "mongoose";



const { Schema, model} =mongoose


/* const userSchema = new Schema({
    name: {type: String,required:true},
    surname: {type: String, required: true},
    image: {type: String, required: true}
},{
    timestamps: true
}) */


const postSchema = new Schema(
    {
        text: {type: String, required: true},
        username: {type: String, required: true},
        image: {type: String, required: true},
       /*  user: [
            userSchema
        ] */
    },{
        timestamps: true
    }
    )

export default model("post",postSchema)