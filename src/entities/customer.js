const Base = require('./base/base')

class Customer extends Base {
    constructor({ id, name, age }) {
        //send to base class.
        super({ id, name })
        this.age = age;
    }
}

module.exports = Customer