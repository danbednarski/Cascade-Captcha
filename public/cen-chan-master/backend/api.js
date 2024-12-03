const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000

const data = JSON.parse(fs.readFileSync('./mock.json'))

app.get('/boards', (req, res) => {
  boards = Object.keys(data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})