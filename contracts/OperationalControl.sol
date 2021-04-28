// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "./OwnerManaged.sol";

contract OperationalControl is OwnerManaged {
    bool private operational = true;

    modifier requireIsOperational() {
        require(isOperational(), "Contract is currently not operational");
        _;
    }

    function isOperational() public view virtual returns (bool) {
        return operational;
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }
}
