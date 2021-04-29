// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

contract FlightSuretyApp is OperationalControl {
    using SafeMath for uint256;

    FlightSuretyData private flightSuretyData;

    constructor(address payable dataContract) OperationalControl() public {
        flightSuretyData = FlightSuretyData(dataContract);
    }

    function isOperational() public view override returns (bool) {
        return OperationalControl.isOperational() && flightSuretyData.isOperational();
    }

    modifier requireAuthorizedAirline(address airline) {
        require(flightSuretyData.isAuthorizedAirline(airline));
        _;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(address newAirline) requireIsOperational external returns (bool success, uint256 votes) {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "Airline is not registered");
        require(flightSuretyData.isAuthorizedAirline(msg.sender), "Airline is not authorized");
        if (flightSuretyData.numberOfRegisteredAirlines() <= 4) {
            flightSuretyData.registerAirline(newAirline);
            success = true;
            votes = 1;
        } else {
            uint256 newAirlineSignedUpAt = flightSuretyData.airlineSignedUpAt(newAirline);
            require(newAirlineSignedUpAt == 0 || flightSuretyData.airlineSignedUpAt(msg.sender) <= newAirlineSignedUpAt,
                "Cannot vote for earlier airlines");
            flightSuretyData.enqueueAirlineForRegistration(newAirline, msg.sender);
            uint256 requiredVotes = (flightSuretyData.numberOfRegisteredAirlines() / 2) + 1;
            if (flightSuretyData.votesForAirline(newAirline) >= requiredVotes) {
                flightSuretyData.registerAirline(newAirline);
                success = true;
                votes = flightSuretyData.votesForAirline(newAirline);
            }
        }
        return (success, votes);
    }

    function isRegisteredAirline() external view returns (bool) {
        return flightSuretyData.isRegisteredAirline(msg.sender);
    }

    function isAuthorizedAirline() external view returns (bool) {
        return flightSuretyData.isAuthorizedAirline(msg.sender);
    }

    function fundInsurance() external payable {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "Airline is not registered");
        flightSuretyData.fundAirline{value : msg.value}(msg.sender);
        if (flightSuretyData.getTotalFundsProvidedByAirline(msg.sender) >= 10 ether) {
            flightSuretyData.authorizeAirline(msg.sender);
        }
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(string memory flight, uint256 timestamp) requireAuthorizedAirline(msg.sender) external {
        flightSuretyData.registerFlight(msg.sender, flight, timestamp);
    }

    function isRegisteredFlight(address airline, string memory flight, uint256 timestamp) external view returns (bool) {
        return flightSuretyData.isRegisteredFlight(airline, flight, timestamp);
    }

    function getFlightStatus(address airline, string memory flight, uint256 timestamp) external view returns (uint8) {
        return flightSuretyData.getFlightStatus(airline, flight, timestamp);
    }

    function buyInsurance(address airline, string memory flight, uint256 timestamp) requireAuthorizedAirline(airline) external payable {
        require(msg.value <= 10 ether, "Cannot insure value this big");
        flightSuretyData.buyInsurance(airline, flight, timestamp, msg.sender);
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal pure {}
}
