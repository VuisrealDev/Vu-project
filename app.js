const exp = require('constants')
const express = require('express')
const { platform } = require('os')
const { sourceMapsEnabled } = require('process')
const app = express()
const serv = require('http').Server(app)

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

app.use(express.static(__dirname))

const SOCKET_LIST = {}

const io = require('socket.io')(serv, {})

io.sockets.on('connection', function(socket) {
    socket.id = Math.random()

    SOCKET_LIST[socket.id] = socket

    socket.on('new player', data => {
        io.emit('new player', data)
        console.log('User Connected.')
    })
    
    
    socket.id = Math.random()

    socket.on('sendMessage', function(data) {
        io.emit('sendMessage', data)
    })

    socket.on('disconnect', function() {
        delete SOCKET_LIST[socket.id]
    })

    socket.on('playerDis', function(data) {
        io.emit('playerDis', data)
        delete SOCKET_LIST[socket.id]
    })

})

serv.listen(2000, function() {
    console.log('Server started at port*: 2000')
})

