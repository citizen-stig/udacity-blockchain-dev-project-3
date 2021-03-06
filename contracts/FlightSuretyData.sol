// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./OperationalControl.sol";

contract FlightSuretyData is OperationalControl {
    using SafeMath for uint256;

    mapping(address => bool) private authorizedCallers;

    struct Airline {
        bool isRegistered;
        bool isAuthorized;
        uint256 fundsProvided;
        uint256 createdAt;
        address[] votes;
        mapping(address => bool) votedFor;
    }

    mapping(address => Airline) private airlines;
    uint256 public numberOfRegisteredAirlines;


    struct Insurance {
        address passenger;
        uint256 amount;
        //        bool isRefunded;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        Insurance[] insurances;
    }

    mapping(bytes32 => Flight) private flights;

    // passengers balances, insurance reward is stored here;
    mapping(address => uint256) private balances;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event InsuranceBought(
        string flight,
        uint256 timestamp,
        address customer,
        uint256 value
    );

    constructor() public {
        airlines[msg.sender].isRegistered = true;
        airlines[msg.sender].createdAt = block.timestamp;
        numberOfRegisteredAirlines = 1;
    }


    modifier requireAuthorizedCaller() {
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;
    }

    function deAuthorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = false;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */

    function registerAirline(address newAirline) requireAuthorizedCaller external {
        airlines[newAirline].isRegistered = true;
        if (airlines[newAirline].createdAt == 0) {
            airlines[newAirline].createdAt = block.timestamp;
        }
        numberOfRegisteredAirlines += 1;
    }

    function enqueueAirlineForRegistration(address newAirline, address existingAirline) requireAuthorizedCaller external {
        require(airlines[existingAirline].votedFor[newAirline] == false, "Already voted for this airline");
        if (airlines[newAirline].createdAt == 0) {
            airlines[newAirline].createdAt = block.timestamp;
        }
        airlines[newAirline].votes.push(newAirline);
        airlines[existingAirline].votedFor[newAirline] = true;
    }

    function hasVotedFor(address newAirline, address existingAirline) external view returns (bool) {
        return airlines[existingAirline].votedFor[newAirline];
    }

    function votesForAirline(address newAirline) external view returns (uint256) {
        return airlines[newAirline].votes.length;
    }

    function airlineSignedUpAt(address airline) external view returns (uint256) {
        return airlines[airline].createdAt;
    }

    function isRegisteredAirline(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function isAuthorizedAirline(address airline) external view returns (bool) {
        return airlines[airline].isAuthorized;
    }

    function fundAirline(address airline) requireAuthorizedCaller external payable {
        airlines[airline].fundsProvided += msg.value;
    }

    function authorizeAirline(address airline) requireAuthorizedCaller external {
        airlines[airline].isAuthorized = true;
    }

    function getTotalFundsProvidedByAirline(address airline) external view returns (uint256) {
        return airlines[airline].fundsProvided;
    }

    function registerFlight(address airline, string memory flight, uint256 timestamp) requireAuthorizedCaller external {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        flights[key].isRegistered = true;
        flights[key].airline = airline;
        flights[key].updatedTimestamp = block.timestamp;
    }

    function isRegisteredFlight(address airline, string memory flight, uint256 timestamp) external view returns (bool) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].isRegistered;

    }

    function updateFlightStatus(address airline, string memory flight, uint256 timestamp, uint8 statusCode) requireAuthorizedCaller external {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        flights[key].updatedTimestamp = block.timestamp;
        flights[key].statusCode = statusCode;
    }

    function getFlightStatus(address airline, string memory flight, uint256 timestamp) external view returns (uint8) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].statusCode;
    }

    function buyInsurance(address airline, string memory flight, uint256 timestamp, address passenger) requireAuthorizedCaller external payable {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        // TODO: check if multiple calls
        flights[key].insurances.push(Insurance(passenger, msg.value));
        emit InsuranceBought(flight, timestamp, passenger, msg.value);
    }

    function getInsuranceBalance(
        address airline,
        string memory flight,
        uint256 timestamp,
        address passenger
    ) external view returns (uint256 insuranceAmount) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        for (uint i = 0; i < flights[key].insurances.length; i++) {
            if (flights[key].insurances[i].passenger == passenger) {
                insuranceAmount = flights[key].insurances[i].amount;
                break;
            }
        }
        return insuranceAmount;
    }

    function getAvailableBalance(
        address passenger
    ) external view returns (uint256 insuranceAmount) {
        return balances[passenger];
    }

    function refundFlight(address airline, string memory flightNumber, uint256 timestamp, uint paybackRatio) requireAuthorizedCaller external {
        bytes32 key = getFlightKey(airline, flightNumber, timestamp);
        Flight memory flight = flights[key];
        for (uint i = 0; i < flight.insurances.length; i++) {
            Insurance memory insurance = flight.insurances[i];
            balances[insurance.passenger] += (insurance.amount * paybackRatio) / 100;
            //            flights[key].insurances[i].isRefunded = true;
        }
    }

    function withdraw(address payable passenger) requireAuthorizedCaller external {
        require(balances[passenger] > 0, "No funds to withdraw");
        uint256 withdrawAmount = balances[passenger];
        balances[passenger] = 0;
        (bool success,) = passenger.call{value : withdrawAmount}("");
        require(success, "Transfer failed.");
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }

    receive() external payable {
        // custom function code
    }
}
