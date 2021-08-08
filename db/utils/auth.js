const crypto = require('crypto')
const jwt = require('jsonwebtoken')

exports.generateSalt = () => {
    return crypto.randomBytes(16).toString('hex')
}

exports.hashPassword = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`)
        .toString(`hex`)
}

exports.validPassword = (password, hash, salt) => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`)
        .toString(`hex`) === hash
}