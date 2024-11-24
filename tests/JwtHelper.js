const Jwt = require('@hapi/jwt');

const JwtTokenManager = require('../src/Infrastructures/security/JwtTokenManager')

const JwtHelper = new JwtTokenManager(Jwt.token);

module.exports = JwtHelper;