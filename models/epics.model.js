const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Project = require('./projects.model');

const epicsSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: Project,
      required: true
    },
    name: {
      type: String,
      required: true
    },
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

module.exports = mongoose.model('epic', epicsSchema);
