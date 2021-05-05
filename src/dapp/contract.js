import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from '../../config/contract.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];

    }

    initialize(callback) {
        let self = this;
        let fund = Web3.utils.toWei("11", "ether");
        const timestamp = Math.floor(Date.now() / 1000);
        this.web3.eth.getAccounts((error, accounts) => {
                const owner = accounts[0];
                this.owner = owner;

                let counter = 1;
                while (this.airlines.length < 4) {
                    let airline = accounts[counter++]
                    this.airlines.push(airline);
                }

                this.flights = {
                    KL1333: {"airline": this.airlines[0], timestamp},
                    "Oceanic 815": {"airline": this.airlines[1], timestamp},
                    LE7701: {"airline": this.airlines[0], timestamp},
                    AUL524: {"airline": this.airlines[0], timestamp},
                    PBD305: {"airline": this.airlines[0], timestamp},
                }
                console.log(this.flights);

                while (this.passengers.length < 5) {
                    this.passengers.push(accounts[counter++]);
                }

                // Registering and funding Airlines
                self.flightSuretyApp.methods
                    .fundInsurance()
                    .send({from: owner, value: fund})
                    .then((result, error) => {
                        Promise
                            .all(
                                self.airlines
                                    .map(airline => {
                                        return self.flightSuretyApp.methods.isRegisteredAirline()
                                            .call({from: airline})
                                            .then(isRegistered => {
                                                return {airline, isRegistered};
                                            });
                                    }))
                            .then(airlines => {
                                Promise
                                    .all(airlines
                                        .filter(({airline, isRegistered}) => !isRegistered)
                                        .map(({airline}) => {
                                                return self.flightSuretyApp.methods
                                                    .registerAirline(airline)
                                                    .send({from: self.owner})
                                                    .then((result, error) => {
                                                        console.log("Funding airline");
                                                        console.log(result, error)
                                                        return self.flightSuretyApp.methods
                                                            .fundInsurance()
                                                            .send({from: airline, value: fund})
                                                    })
                                            }
                                        ))
                                    .then(result => {
                                        console.log("All airlines are registered and funded");
                                        callback();
                                    })
                            })
                    });

            }
        );
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.flights[flight].airline,
            flight: flight,
            timestamp: self.flights[flight].timestamp,
        }
        console.log("Fetching flight status", payload);
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({from: self.owner},
                (error, result) => callback(error, payload));
    }

    buyInsurance(flight, amount, callback) {
        let self = this;
        let payload = {
            airline: self.flights[flight].airline,
            flight: flight,
            timestamp: self.flights[flight].timestamp,
        }
        console.log("Buying insurance", payload);
        const wei = Web3.utils.toWei(amount, "ether");
        console.log("Amount: ", wei);
        console.log("Passenger", self.passengers[0]);
        self.flightSuretyApp.methods
            .buyInsurance(payload.airline, payload.flight, payload.timestamp)
            .send({
                from: self.passengers[0],
                value: wei,
                gasLimit: 900000
            }, (error, result) => {
                console.log("Buying insurance: Before callback")
                console.log({error, result});
                callback(error, payload)
            });
    }

    withdraw(callback) {
        let self = this;
        self.flightSuretyApp.methods.withdraw()
            .send({from: self.passengers[0]}, callback)
    }
}
