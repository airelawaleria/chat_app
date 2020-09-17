const generateMessage = (username, text) => {
    return {
        username,
        message: text,
        timestamp: new Date().getTime()
    }
}

const generateLocationMessage = (username, location) => {
    return {
        username,
        location,
        timestamp: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}