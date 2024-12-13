const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./users.model');

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: User,
      required: true
    }],
    description: {
      type: String,
      required: false
    },
    icon: {
      type: String,
      required: false
    }
  }
)

module.exports = mongoose.model('project', projectSchema);
