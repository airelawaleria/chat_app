const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
// For socket usage, we explicitly start the server (was actually always started implicitly by express)
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

// Middleware function for serving static assets from the specified directory
app.use(express.static(publicDirPath))

// connection and disconnect events are build-in events
io.on('connection', (socket) => {
    console.log('New connection!')

    socket.on('join', (options, callback) => {
        const {user, error} = addUser({id: socket.id, ...options})
        if (error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the chat room!`))

        io.to(user.room).emit('updateRoomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        } 

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (latitude, longitude, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })

    // In comparison to connection event, the disconnection event is called on the socket
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        console.log('Disconnected')
        if (user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left the chat room.`))
            io.to(user.room).emit('updateRoomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    /* socket.emit('countUpdated', count)

    socket.on('increment', () => {
        count++
        //socket.emit('countUpdated', count)
        io.emit('countUpdated', count)
    }) */
})

// We call the listen() function on the server instead of the app
server.listen(port, () => {
    console.log(`Chat App running on port ${port}.`)
})