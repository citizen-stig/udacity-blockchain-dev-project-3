const Test = require('../config/testConfig.js');

contract('FlightSurety: separation of concerns', async (accounts) => {
    let config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    describe('Operational status control', async function () {
        it('is operational initially');
        it('forbids changing operational status for non-owner');
        it('allows changing operational status for contract owner');
        it('blocks access to functions when non operational');
    });

    describe('Multiparty', async function() {
        it('forbids non-authorized caller from calling data functions');
        it('allows app contract to change data');
        it('forbids non contract owner to authorize new caller');
        it('allows contract owner to add authorized caller');
        it('allows contract owner to remove authorized caller');
    });
});
