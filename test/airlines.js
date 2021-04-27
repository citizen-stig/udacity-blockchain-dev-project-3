const Test = require('../config/testConfig.js');

contract('FlightSurety: airlines', async (accounts) => {
    let config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    describe('Registration', async function () {
        it('has first airlines initially');
        it('forbids registering new airlines from non-registered airlines');
        it('allows existing airlines to register new one');
    });
});
