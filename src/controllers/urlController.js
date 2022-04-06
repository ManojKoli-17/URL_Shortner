const urlModel = require("../models/urlModel");
const shortid = require('shortid');
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  17311,
  "redis-17311.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("zpTKDAESQsRwlyVb9hfRAVNB3hZe0pxF", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidUrl=/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/


const createUrl = async function (req, res) {
  try {
      const longUrl=req.body.longUrl
      const baseUrl="http://localhost:3000"

    if (!isValid(longUrl)) {
        res.status(400).send({ status: false, message: "URL is required" });
        return;
    }

    if(!isValidUrl.test(longUrl)) {
        res.status(400).send({ status: false, msg: "Plz enter valid URL" });
        return;
    }
    const isUrlPresent = await urlModel.findOne({longUrl:longUrl})
    if(isUrlPresent){
        res.status(200).send({status:true, message:`  ${isUrlPresent.shortUrl}  ,this is the short url that already created for this Long URL`})
        return

        // res.status(200).send({status:true, message:"Short URL already created for this provide Long URL", data:isUrlPresent})
        // return
    }

      const urlCode = shortid.generate().toLowerCase()
      const shortUrl = baseUrl+ '/' +urlCode
      
      let cachedLongUrlData = await GET_ASYNC(`${isUrlPresent}`)
      if(cachedLongUrlData){
          res.status(400).send({status:false, message:"Data is already stored in Cache Memory"})
      }
      else{
          await SET_ASYNC(`${longUrl}`,JSON.stringify(isUrlPresent))
          urlCreated = await urlModel.create({ urlCode, longUrl, shortUrl })
          res.status(201).send({status:true, message:"Short Url created successfully!",data:urlCreated})
      }

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getUrl=async function(req,res){   
    try {
        let urlCode=req.params.urlCode
        
        isUrlCodePresent=await urlModel.findOne({urlCode:urlCode})
        
        if (urlCode.trim().length==0) {
            res.status(400).send({ status: false, message: "plz provide URL Code in params" });
            return;
        }

        if(!isUrlCodePresent){
            res.status(404).send({status:false, message:"Url not found with this urlCode"})
            return
        }

        let cahcedUrlData = await GET_ASYNC(`${req.params.urlCode}`)
        if(cahcedUrlData) {
            res.redirect(JSON.parse(cahcedUrlData).longUrl)
          }else{
              await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(isUrlCodePresent))
              res.redirect(isUrlCodePresent.longUrl)
          }
    } catch (err) {
        res.status(500).send({status:false, message:err.message})
    }
}

module.exports = { createUrl,getUrl };
