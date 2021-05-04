const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function (deployer) {

    deployer.deploy(FlightSuretyData)
        .then(flightSuretyData => {
            return deployer.deploy(FlightSuretyApp, flightSuretyData.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }

                    fs.writeFileSync(__dirname + '/../config/contract.json', JSON.stringify(config, null, '\t'), 'utf-8');
                    console.log("Authorizing caller")
                    flightSuretyData.authorizeCaller(FlightSuretyApp.address).then((result, error) => {
                        // console.log(result);
                        if (error) {
                            console.log(error);
                        }
                    });
                });
        });
}
