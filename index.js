const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const app = express()
const stripe = require('stripe')('sk_test_0bOcpUCRsdQionfAo3SW5tWr')
const port = 3001

app.use(helmet())

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/shop/order/process')) {
      req.rawBody = buf.toString()
    }
  }
}))

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(cors({
  origin: [/http:\/\/localhost:\d+$/],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.get('/api/', (req, res) => res.send({ version: '1.0' }))

app.post('/api/shop/order', async (req, res) => {
  const order = req.body.order
  const source = req.body.source
  try {
    const stripeOrder = await stripe.orders.create(order)
    console.log(`Order created: ${stripeOrder.id}`)
    await stripe.orders.pay(stripeOrder.id, {source})
  } catch (err) {
    // Handle stripe errors here: No such coupon, sku, ect
    console.log(`Order error: ${err}`)
    return res.sendStatus(500)
  }
  return res.sendStatus(200)
})

app.post('/api/shop/order/process', async (req, res) => {
  const sig = req.headers['stripe-signature']
  try {
    const event = await stripe.webhooks.constructEvent(req.rawBody, sig, 'whsec_gsk2Fd6HJLJdI1zcSgQuQYZU9210L5Sy')
    console.log(`Processing Order : ${event.data.object.id}`)
    // Process payed order here
  } catch (err) {
    return res.sendStatus(500)
  }
  return res.sendStatus(200)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
