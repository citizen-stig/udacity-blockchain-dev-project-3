const Test = require('../config/testConfig.js');

contract('FlightSurety: oracles', async (accounts) => {

    const TEST_ORACLES_COUNT = 15;
    let airline = accounts[1];
    let oracles = accounts.slice(5);
    let oracleIndexes = {};
    let config;

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);

        const fundFee = web3.utils.toWei("11", "ether");
        await config.flightSuretyApp.fundInsurance({from: config.owner, value: fundFee});
        await config.flightSuretyApp.registerAirline(airline, {from: config.owner});
        await config.flightSuretyApp.fundInsurance({from: airline, value: fundFee});

    });


    describe('Oracle registration', async function () {
        it('cannot register with insufficient fee');
        it('can register', async function () {
            let fee = web3.utils.toWei("1", "ether");
            for (let i = 1; i < TEST_ORACLES_COUNT; i++) {
                let oracle = oracles[i];
                await config.flightSuretyApp.registerOracle({from: oracle, value: fee});
                let indexes = await config.flightSuretyApp.getMyIndexes.call({from: oracle});
                // console.log(`Oracle Registered: ${indexes[0]}, ${indexes[1]}, ${indexes[2]}`);
                assert.equal(3, indexes.length);
                oracleIndexes[oracle] = indexes.map(idx => idx.toNumber());
            }
        });
        it('does not give index to non registered');
        it('assigns indexes to oracles', function() {
            for (let i = 1; i < TEST_ORACLES_COUNT; i++) {
                let oracle = oracles[i];
                let indexes = oracleIndexes[oracle];
                assert.equal(3, indexes.length);
            }
        });

    });

    describe('Flight status request', async function () {
        let flight = 'KL1395'; // Amsterdam - Saint Petersburg
        let timestamp = Math.floor(Date.now() / 1000);
        let index;
        let oracleRequestEvenEmitted;
        before(async () => {
            let event = config.flightSuretyApp.OracleRequest();
            event.on('data', e => {
                oracleRequestEvenEmitted = true;
                index = e.args.index.toNumber();
            });
        });

        it('emits event for oracle request', async function () {
            await config.flightSuretyApp.fetchFlightStatus(airline, flight, timestamp);
            assert.isTrue(oracleRequestEvenEmitted);
        });
        it('accepts response only from expected oracles', async function() {
            for (let i = 1; i < TEST_ORACLES_COUNT; i++) {
                let oracle = oracles[i];
                if (oracleIndexes[oracle].includes(index)) {
                    await config.flightSuretyApp.submitOracleResponse(
                        index,
                        airline,
                        flight,
                        timestamp,
                        STATUS_CODE_ON_TIME,
                        {from: oracle});
                }
            }
        });
        it('emits event for flight status info')
        it('forbids accepting data from non-expected oracles');
    });

    describe('Oracle handles flight status', async function() {

    });
});
