// Client-side code
const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

/* socket.on('countUpdated', (count) => {
    console.log('The count has been updated: ', count)
})

document.querySelector('#increment').addEventListener('click', () => {
    console.log('Clicked')
    socket.emit('increment')
}) */

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height 
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled? -- scrollTop = distance between the scroll bar and the top
    const scrollOffset = $messages.scrollTop + visibleHeight

    // We want to make sure we were at the bottom when the new message was added
    /* console.log(containerHeight - newMessageHeight)
    console.log(scrollOffset) */
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // Autoscroll, meaning we set the scrollTop distance to the maximum value
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg)

    const html = Mustache.render(messageTemplate, {username: msg.username, message: msg.message, timestamp: moment(msg.timestamp).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', msg => {
    console.log(msg)

    const html = Mustache.render(locationMessageTemplate, {username: msg.username, location: msg.location, timestamp: moment(msg.timestamp).format('h:mm a')})
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('updateRoomData', ({room, users}) => {
    console.log(room, users)

    const html = Mustache.render(sidebarTemplate, {room, users})
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Disabling the button while the message is getting sent
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const message =  /* document.querySelector('input').value  */ e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        // Reenabling the submit button in the ACK callback
        $messageFormButton.removeAttribute('disabled', 'disabled')
        $messageFormInput.value = ''
        // To mode the cursor inside of the input field
        $messageFormInput.focus()

        if (error){
            return console.log(error)
        }
        console.log('Delivered!')
    })
})

// Click event is known for buttons, submit event is for forms
$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault()

    $sendLocationButton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }

    // Asyncronous function, but it does not support promises api
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', position.coords.latitude, position.coords.longitude, (error) => {
            $sendLocationButton.removeAttribute('disabled', 'disabled')

            if (error){
                return console.log(error)
            }
            console.log('Location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href = '/'
    }
})