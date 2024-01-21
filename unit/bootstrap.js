// загрузка env файла с переменными окружения
require('dotenv').config()

// Инициализация express-приложения
const express = require('express')
const app = express()

// Http-сервер
const http = require('http')
const server = http.createServer(app)

// Инициализация сокетов
const { Server } = require('socket.io')
const io = new Server(server)

// База данных
const sequelize = require('./db')

// Папка со статическими файлами
app.use(express.static('public'))

// Использую куки
const cookieParser = require('cookie-parser')
app.use(cookieParser())

// Использую шаблонизатор pug
app.set('view engine', 'pug')

// Базовый каталог для шаблонов pug
const path = require('path')
app.locals.basedir = path.join(__dirname, '../views')

// Добавляю поддержку загрузки файлов на сервер
const fileUpload = require('express-fileupload')
app.use(fileUpload())

// Загрузка роутов
require('./routing')(app)

// Загрузка роутов сокетов
require('./socketRouting')(io)

// Запуск менеджера заказов
const OrderManager = require('./OrderManager')
OrderManager.loadWaitingOrders(io)

module.exports = {
	app,
	server,
	io,
	sequelize,
}
