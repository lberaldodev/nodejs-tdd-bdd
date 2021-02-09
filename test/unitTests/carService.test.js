const CarService = require('../../src/services/carService')
const Transaction = require('../../src/entities/transaction')

const { describe, it } = require('mocha')
const { join } = require('path')
const { expect } = require('chai')
const sinon = require('sinon')

const carsDatabase = join(__dirname, '../../database', "cars.json")

const mocks = {
    validCarCategory: require(join(__dirname, '../mocks', "valid-carCategory.json")),
    validCar: require(join(__dirname, '../mocks', "valid-car.json")),
    validCustomer: require(join(__dirname, '../mocks', "valid-customer.json")),
}

describe('CarService suite tests', () => {
    let carService = {}
    let sandbox = {}

    before(() => {
        // always we instance the service to ensure that will be an empty instance
        carService = new CarService({ cars: carsDatabase })
    })
    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })
    afterEach(() => {
        sandbox.restore()
    })

    it('Should retrieve a random position from an array', async () => {
        const data = [0, 1, 2, 3, 4]
        const result = carService.getRandomPositionFromArray(data)

        expect(result).to.be.lte(data.length).and.be.gte(0)
    })

    it('Should choose the first id from carIds in carCategory', async () => {
        //stub pattern to return always the same item because we know that the getRandomPositionFromArray is working.
        const carCategory = mocks.validCarCategory;
        const carIdIndex = 0;

        sandbox.stub(carService, carService.getRandomPositionFromArray.name).returns(carIdIndex)

        const result = carService.chooseRandomCar(carCategory)
        const expected = carCategory.carIds[carIdIndex]

        expect(carService.getRandomPositionFromArray.calledOnce).to.be.ok
        expect(result).to.be.equal(expected)
    })

    it('Given a carCategory it should return an available car', async () => {
        const car = mocks.validCar;

        //to update only this instance
        const carCategory = Object.create(mocks.validCarCategory)
        carCategory.carIds = [car.id]

        //mock the car to dont use any external dependency (json / databases)
        sandbox.stub(carService.carRepository, carService.carRepository.find.name).resolves(car)

        //check if the function was called correctly in the expects
        sandbox.spy(carService, carService.chooseRandomCar.name)

        const result = await carService.getAvailableCar(carCategory)
        const expected = car

        expect(carService.chooseRandomCar.calledOnce).to.be.ok
        expect(carService.carRepository.find.calledWithExactly(car.id)).to.be.ok
        expect(result).to.be.deep.equal(expected)
    })

    it('given a carCategory, customer and numberOfDays, it should calculate the final amount in REAL', () => {

        //to prevent changes in tax class we fix the values here.
        sandbox.stub(carService, "taxedBasedOnAge").get(() => {
            return [{
                from: 31, to: 100, then: 1.3
            }]
        })
        const customer = Object.create(mocks.validCustomer)
        //freeze as usecase
        customer.age = 50

        const carCategory = Object.create(mocks.validCarCategory)
        carCategory.price = 37.6

        const numberOfDays = 5;

        const expected = carService.currencyFormat.format(244.40)
        const result = carService.calculateFinalPrice(customer, carCategory, numberOfDays)

        expect(result).to.be.deep.equal(expected)
    })

    it('given a customer and a car category it should return a transaction receipt', async () => {
        const car = Object.create(mocks.validCar)

        const carCategory = { ...mocks.validCarCategory, price: 37.6, carIds: [car.id] }
        carCategory.price = 37.6

        const customer = Object.create(mocks.validCustomer)
        customer.age = 20

        const numberOfDays = 5;
        const dueDate = "10 de novembro de 2020"

        const now = new Date(2020, 10, 5)
        
        sandbox.useFakeTimers(now.getTime())
        sandbox.stub(carService.carRepository, carService.carRepository.find.name).resolves(car)

        expectedAmount = carService.currencyFormat.format(206.80)
        const result = await carService.rent(customer, carCategory, numberOfDays)

        const expected = new Transaction({
            customer,
            car,
            dueDate,
            amount: expectedAmount
        })
        expect(result).to.be.deep.equal(expected)
    })
})