import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from '../../config/contract.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {
        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        // // Watch contract events
        //     const STATUS_CODE_UNKNOWN = 0;
        //     const STATUS_CODE_ON_TIME = 10;
        //     const STATUS_CODE_LATE_AIRLINE = 20;
        //     const STATUS_CODE_LATE_WEATHER = 30;
        //     const STATUS_CODE_LATE_TECHNICAL = 40;
        //     const STATUS_CODE_LATE_OTHER = 50;
        this.statusMap = {
            0: "UNKNOWN",
            10: "ON_TIME",
            20: "LATE_AIRLINE",
            30: "LATE_WEATHER",
            40: "LATE_TECHNICAL",
            50: "LATE_OTHER",
        }
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
        const wei = Web3.utils.toWei(amount.toString(), "ether");
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

    checkBalance(callback) {
        let self = this;
        self.flightSuretyApp.methods.getAvailableBalance()
            .call({from: self.passengers[0]}, (error, result) => {
                if (error) {
                    callback(error, result);
                } else {
                    callback(error, Web3.utils.fromWei(result, "ether"));
                }
            });
    }

    withdraw(callback) {
        let self = this;
        self.flightSuretyApp.methods.withdraw()
            .send({from: self.passengers[0]}, callback)
    }

    addFlightStatusListener(callback) {
        let self = this;
        self.flightSuretyApp.events.FlightStatusInfo({}, function (error, event) {
            if (error) console.log(error)
            if (error) {
                callback(error, event);
            } else {
                let result = event.returnValues;
                result.status_name = self.statusMap[event.returnValues.status];
                callback(error, result);
            }

        });
    }
}
