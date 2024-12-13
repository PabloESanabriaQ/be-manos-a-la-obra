const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Story = require('./stories.model');

const tasksSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    story: {
      type: Schema.Types.ObjectId,
      ref: Story,
      required: true
    },
    created: {
      type: Date,
      default: Date.now,
      required: false
    },
    dueDate: {
      type: Date,
      required: false
    },
    done: {
      type: Boolean,
      required: false,
      default: false
    }
  }
)

module.exports = mongoose.model('task', tasksSchema);
