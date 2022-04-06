const mongoose = require("mongoose");


const UrlSchema = new mongoose.Schema(
    {
        urlCode:{
            type:String,
            unique:true,
            lowercase:true,
            trim:true
        },
        longUrl:{
            type:String,
            required:true,
            trim:true
        },
        shortUrl:{
            type:String,
            unique:true,
            trim:true
        }

    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("Urls", UrlSchema);