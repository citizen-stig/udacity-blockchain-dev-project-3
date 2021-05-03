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
        this.web3.eth.getAccounts((error, accounts) => {

            this.owner = accounts[0];

            self.flightSuretyApp.methods
                .fundInsurance()
                .send({from: this.owner, value: Web3.utils.toWei("11", "ether")}, (error, something) => {
                    let counter = 1;
                    while (this.airlines.length < 5) {
                        let airline = accounts[counter++]
                        this.airlines.push(airline);
                    }


                    const timestamp = Math.floor(Date.now() / 1000);
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


                    callback();
                });
        });
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
        self.flightSuretyApp.methods
            .buyInsurance(payload.airline, payload.flight, payload.timestamp)
            .send({
                from: self.passengers[0],
                value: Web3.utils.toWei(amount, "ether")
            }, (error, result) => {
                console.log({error, result});
                callback(error, payload)
            });
    }
}
