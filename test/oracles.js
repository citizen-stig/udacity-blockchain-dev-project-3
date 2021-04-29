const web3 = require('web3');
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


    describe('Oracle', async function () {
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
        it('assigns indexes to oracles');

    });

    describe('Flight status request', async function () {
        let flight = 'KL1395'; // Amsterdam - Saint Petersburg
        let timestamp = Math.floor(Date.now() / 1000);
        let index;
        let eventEmitted;
        before(async () => {
            let event = config.flightSuretyApp.OracleRequest();
            event.on('data', e => {
                eventEmitted = true;
                index = e.args.index.toNumber();
            });
        });

        it('emits event for status', async function () {
            await config.flightSuretyApp.fetchFlightStatus(airline, flight, timestamp);
            assert.isTrue(eventEmitted);
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
        it('forbids accepting data from non-expected oracles');
    });

    // it('can register oracles', async () => {
    //
    //     // ARRANGE
    //     let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    //
    //     // ACT
    //     for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
    //         await config.flightSuretyApp.registerOracle({from: accounts[a], value: fee});
    //         let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
    //         // console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    //     }
    // });
    // it('can request flight status'
    // it('can request flight status', async () => {
    //
    //     // ARRANGE
    //     let flight = 'ND1309'; // Course number
    //     let timestamp = Math.floor(Date.now() / 1000);
    //
    //     // Submit a request for oracles to get status information for a flight
    //     await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    //     // ACT
    //
    //     // Since the Index assigned to each test account is opaque by design
    //     // loop through all the accounts and for each account, all its Indexes (indices?)
    //     // and submit a response. The contract will reject a submission if it was
    //     // not requested so while sub-optimal, it's a good test of that feature
    //     for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
    //
    //         // Get oracle information
    //         let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
    //         for (let idx = 0; idx < 3; idx++) {
    //
    //             try {
    //                 // Submit a response...it will only be accepted if there is an Index match
    //                 await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, {from: accounts[a]});
    //
    //             } catch (e) {
    //                 // Enable this when debugging
    //                 console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
    //             }
    //
    //         }
    //     }
    // });
});
