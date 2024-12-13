const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema(
  {
    email:{
      type:String,
      required:true
    },
    username:{
      type:String,
      required:true
    },
    password:{
      type:String,
      required:true
    },
    name:{
      first:{
        type:String,
        required:false
      },
      last:{
        type:String,
        required:false
      }
    }
  }
)

module.exports = mongoose.model('user', usersSchema);
