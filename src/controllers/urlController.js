const UrlModel = require('../models/urlModel')
const shortId = require('shortid')
const ValidUrl = require('valid-url')
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    17357,
     "redis-17357.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("IJq533yca48HvXwllP54bDkkxF29rNoD", function (err) {
    if (err) throw err;
  });

  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  
  //1. connect to the server
  //2. use the commands :
  
  //Connection setup for redis
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function (value) {
    if (typeof value == undefined || value == null || value.length == 0) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true

}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const createUrl = async function (req, res) {
    try {
        const baseUrl = "http://localhost:3000"
        data = req.body

        const { longUrl } = data

               if (!isValidRequestBody(data)){
         return res.status(400).send({ status: false, msg: "Please Enter some longUrl data" })
        }
        if (!isValid(longUrl)) {
            
            return res.status(400).send({ status: false, message: "please Provide longUrl" })
        }
        let cache = await GET_ASYNC(`${longUrl}`)
        if(cache){
            let res = JSON.parse(cache)
            console.log("data is from cache")
            return res.status(200).send(res)
        }

        if (!(/^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(longUrl))) {

            return res.status(400).send({ status: false, message: "please enter a valid URL" })
        }

        if (!ValidUrl.isUri(baseUrl)) {
            return res.status(401).send('Invalid base URL')
        }
        // This will generate the urlcode 
        const urlCode = shortId.generate().match(/[a-z\A-Z]/g).join("") //---this will give only Alphabet
       // let urlCode = (Math.random()+1).toString(36).substring(7)
        if (ValidUrl.isUri(longUrl)) {

            let url = await UrlModel.findOne({ longUrl:longUrl}).select({_id:0})
            
            if (url ) {
                    return res.status(400).send({ status: false, message: "This url is already shorten" , msg:url})

                } else {
                  // To create shorturl from adding the baseurl and urlcode
                    const shortUrl = baseUrl + '/' + urlCode.toLowerCase()
                   
               let input = { longUrl: data.longUrl,shortUrl:shortUrl, urlCode:urlCode }

          const created = await UrlModel.create(input)

                                const result = {
                                    longUrl: created.longUrl,
                                    shortUrl: created.shortUrl,
                                    urlCode: created.urlCode
                                }
                    
                                
                 const saveShortUrl = await SET_ASYNC(`${urlCode}`, JSON.stringify(result))
                 console.log(saveShortUrl)
                return res.status(201).send({ status: true,msg: "create successfully", data: result })
            }

        }
        
   }
    catch (err) {

        return res.status(500).send('Server Error')
    }

}

     

const getUrlCode = async function(req,res) {
    try {
        const urlCode =req.params.urlCode.trim().toLowerCase()
      
        if(!isValid(urlCode)) {
            return res.status(400).send({status: false, msg: "Please provide urlCode"})
        }
        //  This will check the data from cache(redis),if there is any data ,it will fetch the data.
        let cache = await GET_ASYNC(`${urlCode}`);
        if(cache) {
            let response = JSON.parse(cache);
            console.log(" data from cache");
            return res.status(302).redirect(response.longUrl)
        }

      // If we have don't set any data in cache ,then it will fetch the data from mongo db
        const url = await UrlModel.findOne({urlCode: urlCode})
        if(url) {
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url));
            console.log(" data from mongoDB");
            return res.status(302).redirect(url.longUrl);
        } else{
            return res.status(404).send({status: false, msg: "No urlCode matches"})
        }
    }
    catch (err) {
        console.log("This is the error :", err.message)
        return res.status(500).send({status: false, msg:err.message })
    }
}




module.exports.createUrl = createUrl;
module.exports.getUrlCode = getUrlCode;
