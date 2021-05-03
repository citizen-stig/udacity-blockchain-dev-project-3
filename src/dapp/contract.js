import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from '../../config/contract.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(window.ethereum);
        let self = this;
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(accounts => {
                self.accounts = accounts;
                self.account = accounts[0];
                self.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
                console.log("BOOM");
                callback();
            });
        // this.initialize(callback);
        // this.owner = null;
        // this.airlines = [];
        // this.passengers = [];
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call(callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.account,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        console.log("Request flight status", payload);
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({from: self.account}, (error, result) => {
                callback(error, payload);
            });
    }

    registerAirline(address, callback) {
        let self = this;

    }
}
