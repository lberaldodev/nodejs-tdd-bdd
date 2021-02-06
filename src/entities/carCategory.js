const Base = require('./base/base')

class CarCategory extends Base {
    constructor({ id, name, price, carIds }) {
        //send to base class.
        super({ id, name })

        this.price = price;
        this.carIds = carIds;
 
    }
}

module.exports = CarCategory