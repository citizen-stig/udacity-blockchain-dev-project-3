const Test = require('../config/testConfig.js');

contract('FlightSurety: airlines', async (accounts) => {
    let config;
    const fundAmount = web3.utils.toWei("11", "ether");

    before('setup contract', async () => {
        config = await Test.Config(accounts);
    });

    describe('Onboarding', async function () {

        it('has first airline registered initially', async function () {
            const isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: config.firstAirline});
            assert.isTrue(isRegistered);
            const isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.firstAirline});
            assert.isFalse(isAuthorized);
        });
        it('forbids registering new airlines by non-authorized airlines', async function () {
            try {
                await config.flightSuretyApp.registerAirline(config.airlines[0], {from: config.firstAirline});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Airline is not authorized", error.reason);
            }

        });
        it('authorizes airline when it sent 10 ether total', async function () {
            const firstAmount = web3.utils.toWei("7", "ether");
            await config.flightSuretyApp.fundInsurance({from: config.owner, value: firstAmount});
            let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.firstAirline});
            assert.isFalse(isAuthorized);

            const secondAmount = web3.utils.toWei("4", "ether");
            await config.flightSuretyApp.fundInsurance({from: config.owner, value: secondAmount});
            let third = await config.flightSuretyData.getTotalFundsProvidedByAirline.call(config.firstAirline);
            assert.equal("11000000000000000000", third.toString());

            isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.firstAirline});
            assert.isTrue(isAuthorized);
        });
        it('forbids registering new airlines by non-registered airlines', async function () {
            try {
                await config.flightSuretyApp.registerAirline(config.airlines[1], {from: config.airlines[0]});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Airline is not registered", error.reason);
            }
        });

        it('just registers new airline from one of previous until number of registered < 4', async function () {
            let newAirline = config.airlines[0];
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
            let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: newAirline});
            assert.isTrue(isRegistered);

            let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: newAirline});
            assert.isFalse(isAuthorized);
        });

        it('requires more than 50% of authorized airlines to vote for new', async function () {

            for (let i = 1; i < 4; i++) {
                let newAirline = config.airlines[i];
                await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
                let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: newAirline});
                assert.isTrue(isRegistered);
                await config.flightSuretyApp.fundInsurance({from: newAirline, value: fundAmount});
                let isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: newAirline});
                assert.isTrue(isAuthorized);
            }
            await config.flightSuretyApp.fundInsurance({from: config.airlines[0], value: fundAmount});
            // 5 airlines are authorized.

            // Register fifth
            let sixth = config.airlines[5];
            await config.flightSuretyApp.registerAirline(sixth, {from: config.firstAirline});
            let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: sixth});
            assert.isFalse(isRegistered);
            await config.flightSuretyApp.registerAirline(sixth, {from: config.airlines[1]});
            await config.flightSuretyApp.registerAirline(sixth, {from: config.airlines[2]});
            isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: sixth});
            assert.isTrue(isRegistered);
        });
        it('prevents double votes', async function () {
            let newAirline = config.airlines[6];
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.airlines[0]});
            try {
                await config.flightSuretyApp.registerAirline(newAirline, {from: config.airlines[0]});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Already voted for this airline", error.reason);
            }
        });
        // it('prevents voting for earlier airlines', async function () {
        //     let prevAirline = config.airlines[6]
        //     await config.flightSuretyApp.registerAirline(prevAirline, {from: config.airlines[2]});
        //     let lastAirline = config.airlines[7]
        //     await Promise.all(config.airlines
        //         .slice(0, 4)
        //         .map(airline => config.flightSuretyApp.registerAirline(lastAirline, {from: airline})));
        //     let isRegistered = await config.flightSuretyApp.isRegisteredAirline.call({from: lastAirline});
        //     assert.isTrue(isRegistered);
        //     await config.flightSuretyApp.fundInsurance({from: lastAirline, value: fundAmount});
        //     try {
        //         await config.flightSuretyApp.registerAirline(prevAirline, {from: lastAirline});
        //         assert.fail("Should not allow to process");
        //     } catch (error) {
        //         console.log("_+_+_+_+_+_+_");
        //         console.log(error);
        //         console.log("=================")
        //         assert.equal("Cannot vote for earlier airlines", error.reason);
        //     }
        // });
    });
    describe('Flight registering', async function () {
        let flightNumber = "815";
        let timestamp = Math.floor(+new Date() / 1000) + 86400; // tomorrow
        it('allows authorized airline register flight', async function () {
            let statusBefore = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isFalse(statusBefore);
            await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: config.owner});
            let statusAfter = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isTrue(statusAfter);
        });
    });


});
