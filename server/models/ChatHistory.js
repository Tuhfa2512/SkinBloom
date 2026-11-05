import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true
    },

    text: {
      type: String,
      required: true,
      maxlength: 10000
    },

    products: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    title: {
      type: String,
      default: 'New Conversation',
      maxlength: 100
    },

    messages: {
      type: [chatMessageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
)

chatHistorySchema.index({
  userId: 1,
  updatedAt: -1
})

const ChatHistory = mongoose.model(
  'ChatHistory',
  chatHistorySchema
)

export default ChatHistory
