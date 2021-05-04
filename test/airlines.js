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
        it('allows authorized airline register flight', async function () {
            let statusBefore = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isFalse(statusBefore);
            await config.flightSuretyApp.registerFlight(flightNumber, timestamp, {from: config.owner});
            let statusAfter = await config.flightSuretyApp.isRegisteredFlight(config.owner, flightNumber, timestamp);
            assert.isTrue(statusAfter);
        });
    });

    describe('Passengers', async function () {
        let flightNumber = "815";
        let timestamp = Math.floor(+new Date() / 1000) + (86400 * 2);
        let airline;
        let passenger = accounts[11];
        let oracles = accounts.slice(15, 30);
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

                oracleRequestEvent.on('data', async e => {
                    let index = e.args.index.toNumber();
                    if (indexes.includes(index)) {
                        console.log("Submitting result");
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

        it("can buy insurance", async function () {
            await config.flightSuretyApp.buyInsurance(
                airline, flightNumber, timestamp, {from: passenger, value: insuranceAmount});
            let balance = await config.flightSuretyApp
                .getInsuranceBalance.call(airline, flightNumber, timestamp, {from: passenger});
            assert.equal(insuranceAmount, balance);
        });

        it('cannot withdraw funds back before flight');

        it('can withdraw funds if flight got delayed because of airline', function (done) {
            (async () => {
                console.log("Start");
                let flightStatusEvent = config.flightSuretyApp.FlightRefunded();
                let balanceAfter;
                flightStatusEvent.on('data', async e => {
                    let balanceBefore = await web3.eth.getBalance(passenger);
                    console.log({before: balanceBefore});
                    let result = await config.flightSuretyApp.withdraw({from: passenger, gasPrice: 0});
                    console.log(result);
                    balanceAfter = await web3.eth.getBalance(passenger);
                    console.log({after: balanceAfter});
                    console.log({diff: balanceAfter - balanceBefore});
                    let increase = parseFloat(web3.utils.fromWei(String(balanceAfter - balanceBefore)));
                    assert.isTrue(increase - 0.6 < 0.000001);
                    done();
                });
                await config.flightSuretyApp.fetchFlightStatus(airline, flightNumber, timestamp);
            })();
        }, 5000);

    })
});
