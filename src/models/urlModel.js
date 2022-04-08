const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
    urlCode:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true

    },
longUrl:{
    type:String,
    required:true,
    match: /[-a-zA-Z0-9@:%\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%\+.~#?&//=]*)?/gi,

},
shortUrl:{
    type:String,
    required:true,
    unique:true

},
},
{versionKey:false}
)
module.exports = mongoose.model("url" , UrlSchema)