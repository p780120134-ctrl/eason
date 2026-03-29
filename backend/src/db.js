// 確保 dotenv 載入
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const knex = require('knex');
const config = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env] || config.development);

module.exports = db;
