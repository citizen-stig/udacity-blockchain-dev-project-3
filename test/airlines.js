const web3 = require('web3');
const Test = require('../config/testConfig.js');

contract('FlightSurety: airlines', async (accounts) => {
    let config;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    describe('Onboarding', async function () {
        it('has first airline registered initially', async function () {
            const isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: config.owner});
            assert.isTrue(isRegistered);
            const isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.owner});
            assert.isFalse(isAuthorized);
        });
        it('authorizes airline when it sent 10 ether total', async function () {
            const firstAmount = web3.utils.toWei("7", "ether");
            await config.flightSuretyApp.fundInsurance({from: config.owner, value: firstAmount});
            let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.owner});
            assert.isFalse(isAuthorized);

            const secondAmount = web3.utils.toWei("4", "ether");
            await config.flightSuretyApp.fundInsurance({from: config.owner, value: secondAmount});
            let third = await config.flightSuretyData.getTotalFundsProvidedByAirline.call(config.owner);

            isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.owner});
            assert.isTrue(isAuthorized);
        });
        it('forbids registering new airlines by non-registered airlines');
        it('forbids registering new airlines by non-authorized airlines');

        it('just registers new airline from one of previous until number of registered < 4', async function () {
            let newAirline = accounts[1];
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
            let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: newAirline});
            assert.isTrue(isRegistered);

            let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: newAirline});
            assert.isFalse(isAuthorized);
        });

        it('requires more than 50% of authorized airlines to vote for new', async function () {
            const fundAmount = web3.utils.toWei("11", "ether");
            for (let i = 2; i < 5; i++) {
                let newAirline = accounts[i];
                await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
                let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: newAirline});
                assert.isTrue(isRegistered);
                await config.flightSuretyApp.fundInsurance({from: newAirline, value: fundAmount});
                let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: newAirline});
                assert.isTrue(isAuthorized);
            }
            await config.flightSuretyApp.fundInsurance({from: accounts[1], value: fundAmount});
            // 5 airlines are authorized.

            // Register fifth
            let fifthAirline = accounts[5];
            await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.owner});
            let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: fifthAirline});
            assert.isFalse(isRegistered);
            await config.flightSuretyApp.registerAirline(fifthAirline, {from: accounts[1]});
            await config.flightSuretyApp.registerAirline(fifthAirline, {from: accounts[2]});
            isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: fifthAirline});
            assert.isTrue(isRegistered);
        });

        it('prevents double votes');
        it('prevents voting for earlier airlines');
    });
    describe('Flight registering', async function () {
        let flightNumber = "815";
        let timestamp = Math.floor(+new Date() / 1000) + 86400; // tomorrow
        it('allows authorized airline register flight', async function() {
            let statusBefore = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isFalse(statusBefore);
            await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: config.owner});
            let statusAfter = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isTrue(statusAfter);
        });
    });

    describe('Passengers', async function() {
        let flightNumber = "815";
        let timestamp = Math.floor(+new Date() / 1000) + (86400 * 2);
        let airline;
        let passenger = accounts[11];

        before("register flight", async () => {
            airline = config.owner;
            await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: airline});
        });

        it("can buy insurance", async function() {
            await config.flightSuretyApp.buyInsurance(
                airline, flightNumber, timestamp, {from: passenger, value: web3.utils.toWei("0.4", "ether")});
        });
    })
});
