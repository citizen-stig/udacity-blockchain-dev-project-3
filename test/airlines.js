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
            const isRegistered = await config.flightSuretyApp.isRegisteredAirline.call(accounts[0]);
            assert.isTrue(isRegistered);
            const isAuthorized = await config.flightSuretyApp.isAuthorizedAirline.call({from: config.owner});
            assert.isFalse(isAuthorized);
        });
        it('authorizes airline when it sent 10 ether total', async function() {
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
        it('forbids registering new airlines from non-registered airlines');
        it('forbids registering new airlines by non-authorized airlines');

        it('just accepts new airline from one of previous until number of registered < 4', async function () {
            let newAirline = accounts[1];
            let result = await config.flightSuretyApp.registerAirline.call(newAirline, {from: config.owner});
            assert.isTrue(result.success);
            assert.equal(0, result.votes);
        });

    });
});
