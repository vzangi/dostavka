const { Op } = require('sequelize')
const Order = require('../models/Order')
const User = require('../models/User')
const OrderPretendent = require('../models/OrderPretendent')
const bot = require('./bot')
const sequelize = require('./db')
const stage3LoopsCount = 12

class OrderManager {
	// Буфер ожидающих заказов
	static whaitingOrders = {}

	// инстанс сокета
	static io = null

	// первоначальный запуск менеджера заказов
	static async loadWaitingOrders(io) {
		OrderManager.io = io
		const whaitings = await Order.findAll({
			where: {
				status: Order.statuses.WHAITING,
			},
			include: [
				{
					model: User,
					as: 'store',
				},
			],
		})

		for (const index in whaitings) {
			const order = whaitings[index]
			await OrderManager.startFounding(order)
		}
	}

	// Запуск процесса поиска курьера
	static async startFounding(order) {
		OrderManager.whaitingOrders[order.id] = {
			order,
		}
		await OrderManager.stage_1(order)
	}

	// Первый этап поиска курьера
	static async stage_1(order) {
		// Ищу ближайшего претендента
		const pretendents = await OrderManager.findNearDrivers(order, 1)

		// Свободных курьеров нет - перехожу к третьей стадии
		if (pretendents.length == 0) {
			await OrderManager.stage_3(order)
			return
		}

		// Уведомляю курьера о новом заказе
		await OrderManager.notifyDriver(pretendents[0], order)

		// Планирую через 10 секунд запуск второй стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_2(order),
			10 * 1000
		)
	}

	// Вторая стадия ищу всех свободных курьеров
	static async stage_2(order) {
		// Проверяю, находится ли ещё заказ в статусе WHAITING
		const isWhaiting = await Order.findByPk(order.id)

		// Если статус не WHAITING,
		// то убираю заказ из буфера и завершаю обработку
		if (isWhaiting.status != Order.statuses.WHAITING) {
			OrderManager.removeFromWhaitings(order)
			return
		}

		// Ищу нескольких свободных курьеров
		const pretendents = await OrderManager.findPretendents(order, 10)

		// Если нет свободных курьеров -
		// перехожу к третьей стадии
		if (!pretendents) {
			await this.stage_3(order)
			return
		}

		// Прохожусь по свободным курьерам и уведомляю их
		for (const pretendentIndex in pretendents) {
			const pretendent = pretendents[pretendentIndex]

			await OrderManager.notifyDriver(pretendent, order)
		}

		// Планирую через 10 секунд запуск третьей стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_3(order),
			10 * 1000
		)
	}

	static async stage_3(order, loopIndex = 0) {
		if (loopIndex == stage3LoopsCount) {
			// Прошло более двух минут, а курьер не найден

			// Надо уведомить магазин, что заказ можно отменить или подождать ещё
			// и администратора, чтобы попытаться назначить курьера вручную
			return
		}

		// Проверяю, находится ли ещё заказ в статусе WHAITING
		const isWhaiting = await Order.findByPk(order.id)

		// Если статус не WHAITING,
		// то убираю заказ из буфера и завершаю обработку
		if (isWhaiting.status != Order.statuses.WHAITING) {
			OrderManager.removeFromWhaitings(order)
			return
		}

		// Ищу нескольких курьеров, которым ещё не отправлялось приглашение
		const pretendents = await OrderManager.findPretendents(order, 10, true)

		if (pretendents) {
			// Прохожусь по  курьерам и уведомляю их
			for (const pretendentIndex in pretendents) {
				const pretendent = pretendents[pretendentIndex]

				await OrderManager.notifyDriver(pretendent, order)
			}
		}

		// Планирую через 10 секунд запуск третьей стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_3(order, loopIndex + 1),
			10 * 1000
		)
	}

	// Отправка уведомления курьеру о новом заказе
	static async notifyDriver(pretendent, order) {
		// Создаю запись в базе
		await OrderPretendent.create({
			status: OrderPretendent.statuses.WHAITING,
			orderId: order.id,
			driverId: pretendent.id,
		})

		// Уведомляю курьера по сокету о новом заказе
		const sockets = OrderManager.getUserSockets(pretendent.id, '/driver')

		// Если курьер в системе
		if (sockets.length > 0) {
			// Уведомляю его по сокету
			sockets.forEach((socket) => {
				socket.emit('orders.new', order)
			})
		} else {
			// Иначе смотрю, подключён ли он к телеграм-уведомлениям
			const account = await User.findOne({
				where: {
					id: pretendent.id,
				},
				attributes: ['telegramChatId'],
			})

			if (account && account.telegramChatId) {
				const store = await order.getStore()

				let msg = `<a href="${process.env.APP_LINK}/login">Новый заказ №${order.id}</a>`
				msg += `\r\nМагазин: <b>${store.username} (${store.address})</b>`
				msg += `\r\nАдрес доставки: <b>${order.address}</b>`
				if (order.summ && order.summ != 0) {
					msg += `\r\nСумма заказа: <b>${order.summ} р.</b>`
				}
				if (order.comment && order.comment != '') {
					msg += `\r\nКомментарий: <b>${order.comment}</b>`
				}

				bot.sendMessage(account.telegramChatId, msg, { parse_mode: 'HTML' })
			}
		}
	}

	// Поиск курьеров
	static async findPretendents(order, max = 10, takeAll = false) {
		// Беру работающих курьеров в городе, в котором сделан заказ
		const onlineDrivers = await User.findAll({
			where: {
				role: User.roles.DRIVER,
				online: true,
				cityId: order.cityId,
				wallet: {
					[Op.gt]: 0,
				},
			},
		})

		const pretendents = []

		// Прохожусь по каждому по порядку
		for (const driverIndex in onlineDrivers) {
			const onlineDriver = onlineDrivers[driverIndex]

			const alreadySended = await OrderPretendent.count({
				where: {
					orderId: order.id,
					driverId: onlineDriver.id,
				},
			})

			// Если этому курьеру уже отправлялось предложение на этот заказ -
			// пропускаю его
			if (alreadySended != 0) continue

			// Если надо брать только свободных курьеров
			if (!takeAll) {
				// Считаю количество незавершённых заказов,
				// в которых занят этот курьер
				const ordersCount = await Order.count({
					where: {
						driverId: onlineDriver.id,
						status: [Order.statuses.ACCEPTED, Order.statuses.TAKED],
					},
				})

				// если он занят другими заказами - пропускаю
				if (ordersCount != 0) continue
			}

			// Беру курьера
			pretendents.push(onlineDriver)

			// Если количество претендентов равно максимальному -
			// Выхожу из цикла
			if (pretendents.length == max) break
		}

		// Возвращаю претендентов
		return pretendents
	}

	// Поиск ближайших к магазину курьеров
	static async findNearDrivers(order, max = 10) {
		const store = await order.getStore()
		if (!store) {
			return []
		}
		if (!store.longitude) {
			return []
		}

		const lon = store.longitude
		const lat = store.latitude

		// Запрос берущий работающих в данный момент курьеров
		// и сортирующий их по расстоянию до магазина из которого поступил заказ
		const query = `select id, username,
    ( 3959 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) 
    * cos( radians( longitude ) - radians(${lon}) ) + sin( radians(${lat}) ) * sin(radians(latitude)) ) ) AS distance 
    from users 
    where latitude is not null and role = 1 and online = 1 and wallet > 0 and cityId = ${order.cityId}
    order by distance 
    `

		const [drivers, metadata] = await sequelize.query(query)

		const takedDrivers = []

		for (const index in drivers) {
			const driver = drivers[index]

			const alreadySended = await OrderPretendent.count({
				where: {
					orderId: order.id,
					driverId: driver.id,
				},
			})

			if (alreadySended != 0) {
				continue
			}

			const ordersCount = await Order.count({
				where: {
					driverId: driver.id,
					status: [Order.statuses.ACCEPTED, Order.statuses.TAKED],
				},
			})

			// если он занят другими заказами - пропускаю
			if (ordersCount != 0) {
				continue
			}

			const pretendent = await User.findByPk(driver.id)
			takedDrivers.push(pretendent)
			if (takedDrivers.length == max) break
		}

		return takedDrivers
	}

	// Удаление заказа из списка ожидания
	static removeFromWhaitings(order) {
		if (OrderManager.whaitingOrders[order.id]) {
			if (OrderManager.whaitingOrders[order.id].timeoutId) {
				clearTimeout(OrderManager.whaitingOrders[order.id].timeoutId)
			}
			delete OrderManager.whaitingOrders[order.id]
		}
	}

	// Получение сокетов пользователя по Id
	static getUserSockets(userId, nsp = '/') {
		const namespace = OrderManager.io.of(nsp)
		const sockets = []
		try {
			// Проходимся по всем сокетам
			for (const [socketId, s] of namespace.sockets) {
				// Если в сокете нет пользователя (он гость), то пропускаем его
				if (!s.user) continue
				// Если в каком-то из сокетов найден нужный пользователь
				if (s.user.id == userId) {
					sockets.push(s)
				}
			}
		} catch (error) {
			console.log(error)
		}
		return sockets
	}
}

module.exports = OrderManager
