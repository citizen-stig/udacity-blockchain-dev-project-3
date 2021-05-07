const Test = require('../config/testConfig.js');

contract('FlightSurety: oracles', async (accounts) => {

    let airline
    let oracles
    let non
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
        oracles = config.oracles;

        airline = config.airlines[0];

        const fundFee = web3.utils.toWei("11", "ether");
        await config.flightSuretyApp.fundInsurance({from: config.owner, value: fundFee});
        await config.flightSuretyApp.registerAirline(airline, {from: config.owner});
        await config.flightSuretyApp.fundInsurance({from: airline, value: fundFee});

    });

    describe('Oracle registration', async function () {
        it('cannot register with insufficient fee', async function () {
            let amount = web3.utils.toWei("0.3", "ether")
            try {
                await config.flightSuretyApp.registerOracle({from: config.passengers[0], value: amount});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("Insufficient registration fee", error.reason);
            }
        });
        it('can register', async function () {
            let fee = web3.utils.toWei("1", "ether");
            for (let i = 1; i < oracles.length; i++) {
                let oracle = oracles[i];
                await config.flightSuretyApp.registerOracle({from: oracle, value: fee});
                let indexes = await config.flightSuretyApp.getMyIndexes.call({from: oracle});
                // console.log(`Oracle ${oracle} Registered: ${indexes[0]}, ${indexes[1]}, ${indexes[2]}`);
                assert.equal(3, indexes.length);
                oracleIndexes[oracle] = indexes.map(idx => idx.toNumber());
            }
        });
        it('does not give index to non registered', async function () {
            try {
                await config.flightSuretyApp.getMyIndexes.call({from: config.passengers[0]});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.isTrue(error.hijackedStack.includes('Not registered as an oracle'));
            }
        });
        it('assigns indexes to oracles', function () {
            for (let i = 1; i < oracles.length; i++) {
                let oracle = oracles[i];
                let indexes = oracleIndexes[oracle];
                assert.equal(3, indexes ? indexes.length : []);
            }
        });
    });

    describe('Passengers', async function () {
        let flightNumber = "815";
        let timestamp = Math.floor(+new Date() / 1000) + (86400 * 2);
        let airline;
        let passenger = accounts[11];
        let isCallbackActive = true;
        let insuranceAmount = web3.utils.toWei("0.4", "ether");

        before('register flight', async () => {
            airline = config.owner;
            await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: airline});

            let fee = web3.utils.toWei("1", "ether");
            let oracleRequestEvent = config.flightSuretyApp.OracleRequest();
            await Promise.all(oracles.map(async oracle => {
                await config.flightSuretyApp.registerOracle({from: oracle, value: fee});
                let indexes = await config.flightSuretyApp.getMyIndexes.call({from: oracle});
                indexes = indexes.map(i => i.toNumber());
                // console.log(indexes)
                oracleRequestEvent.on('data', async function (e) {
                    if (!isCallbackActive) {
                        return;
                    }
                    let index = e.args.index.toNumber();
                    // console.log(index)
                    if (indexes.includes(index)) {
                        await config.flightSuretyApp.submitOracleResponse(
                            index,
                            airline,
                            flightNumber,
                            timestamp,
                            20,
                            {from: oracle});
                    }
                });
            }));

        });

        after('disable callback', () => {
            isCallbackActive = false;
        })

        it("can buy insurance", async function () {
            await config.flightSuretyApp.buyInsurance(
                airline, flightNumber, timestamp, {from: passenger, value: insuranceAmount});
            let balance = await config.flightSuretyApp
                .getInsuranceBalance.call(airline, flightNumber, timestamp, {from: passenger});
            assert.equal(insuranceAmount, balance);
        });

        it('cannot withdraw funds back before flight', async function () {
            try {
                await config.flightSuretyApp.withdraw({from: passenger});
                assert.fail("Should not allow to process");
            } catch (error) {
                assert.equal("No funds to withdraw", error.reason);
            }
        });

        it('can withdraw funds if flight got delayed because of airline', function (done) {
            (async () => {
                // console.log("Start");
                let flightStatusEvent = config.flightSuretyApp.FlightRefunded();
                let balanceAfter;
                flightStatusEvent.on('data', async e => {
                    if (!isCallbackActive) {
                        return;
                    }
                    let balanceBefore = await web3.eth.getBalance(passenger);
                    // console.log({before: balanceBefore});
                    let result = await config.flightSuretyApp.withdraw({from: passenger, gasPrice: 0});
                    // console.log(result);
                    balanceAfter = await web3.eth.getBalance(passenger);
                    // console.log({after: balanceAfter});
                    // console.log({diff: balanceAfter - balanceBefore});
                    let increase = parseFloat(web3.utils.fromWei(String(balanceAfter - balanceBefore)));
                    assert.isTrue(increase - 0.6 < 0.000001);
                    done();
                });
                await config.flightSuretyApp.fetchFlightStatus(airline, flightNumber, timestamp);
            })();
        }, 5000);

    })
});
