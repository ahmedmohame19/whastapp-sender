import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { appRouter } from './src/app.router.js'
import './src/services/WhatsappService.js'

dotenv.config()
const app = express()

app.use(cors())
const port = process.env.PORT || 6003

appRouter(app, express)

app.listen(port, () => console.log(`WhatsApp Bulk Message Service listening on port ${port}!`))
