const exp = require('constants')
const express = require('express')
const app = express()
const serv = require('http').Server(app)

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

app.use(express.static(__dirname))

const io = require('socket.io')(serv, {})

io.sockets.on('connection', function(socket) {
    socket.on('new player', data => {
        io.emit('new player', data)
    })
    
    console.log('User Connected.')
    socket.id = Math.random()

    socket.on('sendMessage', function(data) {
        io.emit('sendMessage', data)
    })

    

    
})

serv.listen(2000, function() {
    console.log('Server started at port*: 2000')
})