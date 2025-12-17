const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    applicationId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    status: { type: String, default: 'ACTIVE' }, // ACTIVE, DISBURSED, REJECTED
    productType: String,
    amount: Number,
    interestRate: Number,
    tenureMonths: Number,
    emi: Number,
    collateral: String,
    sanctionDate: { type: Date, default: Date.now },
    disbursalDate: Date
});

module.exports = mongoose.model('Loan', loanSchema);