const Test = require('../config/testConfig.js');

contract('FlightSurety: separation of concerns', async (accounts) => {
    let config;
    let another;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        another = config.airlines[0]
    });

    describe('Operational status control', async function () {
        it('is operational initially', async function () {
            let appStatus = await config.flightSuretyApp.isOperational.call();
            assert.isTrue(appStatus, "App contract is not operational initially");
            let dataStatus = await config.flightSuretyData.isOperational.call();
            assert.isTrue(dataStatus, "Data contract is not operational initially");
        });
        it('forbids changing operational status for non-owner', async function () {
            try {
                await config.flightSuretyData.setOperatingStatus(false, {from: config.testAddresses[3]});
                assert.fail("Should not allow change operational status for non-owner");
            } catch (error) {
                assert.equal('Caller is not contract owner', error.reason);
            }
        });
        it('allows changing operational status for contract owner', async function () {
            await config.flightSuretyData.setOperatingStatus(false, {from: config.owner});
            let dataStatus = await config.flightSuretyData.isOperational.call();
            assert.isFalse(dataStatus);
            let appStatus = await config.flightSuretyApp.isOperational.call();
            assert.isFalse(appStatus);
        });
        it('blocks access to functions when non operational', async function () {
            try {
                await config.flightSuretyApp.setOperatingStatus(false, {from: config.owner});
                let appStatus = await config.flightSuretyApp.isOperational.call();
                assert.isFalse(appStatus);
                await config.flightSuretyApp.registerAirline(accounts[3], {from: config.owner});
                assert.fail("Should not allow function call when non operational");
            } catch (error) {
                assert.equal('Contract is currently not operational', Object.values(error.data)[0].reason);
            }
        });
    });

    describe('Multiparty', async function () {
        it('forbids non-authorized caller from calling data functions', async function () {
            try {
                await config.flightSuretyData
                    .registerFlight(another, "KL1234", 123, {from: another});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Caller is not authorized", error.reason);
            }
        });
        it('forbids non contract owner to authorize new caller', async function () {
            try {
                await config.flightSuretyData
                    .authorizeCaller(another, {from: another});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Caller is not contract owner", error.reason);
            }
        });
        it('allows contract owner to add authorized caller', async function () {
            await config.flightSuretyData.authorizeCaller(another, {from: config.owner});
            await config.flightSuretyData.registerFlight(another, "KL1234", 123, {from: another});
        });
        it('forbids non contract owner do deauthorize called', async function () {
            try {
                await config.flightSuretyData.deAuthorizeCaller(config.owner, {from: another});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Caller is not contract owner", error.reason);
            }
        })
        it('allows contract owner to remove authorized caller', async function () {
            await config.flightSuretyData.deAuthorizeCaller(another, {from: config.owner});
            try {
                await config.flightSuretyData
                    .authorizeCaller(another, {from: another});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Caller is not contract owner", error.reason);
            }
        });
    });
});
