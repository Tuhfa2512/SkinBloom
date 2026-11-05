import 'dotenv/config'
import express from 'express'
import chatbotRouter from './routes/chatbot.js'

const app = express()

app.use(express.json())
app.use('/api/chatbot', chatbotRouter)

app.listen(5050, () => {
  console.log('Chatbot test server: http://localhost:5050')
})
