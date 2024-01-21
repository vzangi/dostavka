const Order = require('../models/Order')
const User = require('../models/User')
const OrderPretendent = require('../models/OrderPretendent')
const { Op } = require('sequelize')
const stage3LoopsCount = 12

class OrderManager {
	// Буфер ожидающих заказов
	static whaitingOrders = {}

	// инстанс сокета
	static io = null

	// первоначальный запуск менеджера заказов
	static async loadWaitingOrders(io) {
		// console.log('Запуск процесса загрузки ожидающих заказов')

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

		console.log('Количество ожидающих заказов: ', whaitings.length)

		for (const index in whaitings) {
			const order = whaitings[index]
			await OrderManager.startFounding(order)
		}
	}

	// Запуск процесса поиска курьера
	static async startFounding(order) {
		// console.log('Запуск процесса поиска для заказа: ', order.id)
		OrderManager.whaitingOrders[order.id] = {
			order,
		}
		await OrderManager.stage_1(order)
	}

	// Первый этап поиска курьера
	static async stage_1(order) {
		// console.log('Первый этап для заказа: ', order.id)

		// console.log('Поиск свободного курьера')

		// Пытаюсь найти свободного курьера
		const pretendents = await OrderManager.findPretendents(order, 1)

		// Свободных курьеров нет - перехожу к третьей стадии
		if (pretendents.length == 0) {
			// console.log('Свободных курьеров нет, перехожу к 3 этапу')
			await OrderManager.stage_3(order)
			return
		}
		const pretendent = pretendents[0]

		// console.log('Свободный курьер найден: ', pretendent.username)

		await OrderManager.notifyDriver(pretendent, order)

		// console.log('Планирую через 10 секунд запуск второй стадии')

		// Планирую через 10 секунд запуск второй стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_2(order),
			10 * 1000
		)
	}

	// Вторая стадия ищу всех свободных курьеров
	static async stage_2(order) {
		// console.log('Запуск второй стадии поиска')

		// Проверяю, находится ли ещё заказ в статусе WHAITING
		const isWhaiting = await Order.findByPk(order.id)

		// Если статус не WHAITING,
		// то убираю заказ из буфера и завершаю обработку
		if (isWhaiting.status != Order.statuses.WHAITING) {
			// console.log('Заказ уже принят, завершаю обработку')
			OrderManager.removeFromWhaitings(order)
			return
		}

		// console.log('Ищу свободных курьеров')

		// Ищу нескольких свободных курьеров
		const pretendents = await OrderManager.findPretendents(order, 10)

		// Если нет свободных курьеров -
		// перехожу к третьей стадии
		if (!pretendents) {
			// console.log('Свободных курьеров нет. Перехожу к третьей стадии')
			await this.stage_3(order)
			return
		}

		// console.log('Количество найденных свободных курьеров: ', pretendents.length)

		// Прохожусь по свободным курьерам
		for (const pretendentIndex in pretendents) {
			const pretendent = pretendents[pretendentIndex]

			await OrderManager.notifyDriver(pretendent, order)
		}

		// console.log('Планирую запуск третьей стадии через 10 секунд')

		// Планирую через 10 секунд запуск третьей стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_3(order),
			10 * 1000
		)
	}

	static async stage_3(order, loopIndex = 0) {
		// console.log('Запуск третьей стадии. Номер цикла: ', loopIndex)

		if (loopIndex == stage3LoopsCount) {
			// console.log('Прошло 3 цикла на третьей стадии')

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
			// console.log('Заказ был принят, завершаю обработку')
			OrderManager.removeFromWhaitings(order)
			return
		}

		// console.log('Ищу нескольких курьеров, которым ещё не отправлялось приглашение')

		// Ищу нескольких курьеров, которым ещё не отправлялось приглашение
		const pretendents = await OrderManager.findPretendents(order, 10, true)

		// console.log('Найдено курьеров: ', pretendents.length)

		if (pretendents) {
			// Прохожусь по  курьерам
			for (const pretendentIndex in pretendents) {
				const pretendent = pretendents[pretendentIndex]

				await OrderManager.notifyDriver(pretendent, order)
			}
		}

		// console.log('Планирую запуск третьей стадии через 10 секунд')

		// Планирую через 10 секунд запуск третьей стадии поиска
		OrderManager.whaitingOrders[order.id].timeoutId = setTimeout(
			() => OrderManager.stage_3(order, loopIndex + 1),
			10 * 1000
		)
	}

	// Отправка уведомления курьеру о новом заказе
	static async notifyDriver(pretendent, order) {
		// console.log('Создаю запись в базе')

		// Создаю запись в базе
		await OrderPretendent.create({
			status: OrderPretendent.statuses.WHAITING,
			orderId: order.id,
			driverId: pretendent.id,
		})

		// console.log('Уведомляю курьера: ', pretendent.username)

		// Уведомляю курьера по сокету о новом заказе
		const sockets = OrderManager.getUserSockets(pretendent.id, '/driver')
		sockets.forEach((socket) => {
			socket.emit('orders.new', order)
		})
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

	// Удаление заказа из списка ожидания
	static removeFromWhaitings(order) {
		// console.log('Удаляю заказ из списка ожидающих: ', order.id)
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
