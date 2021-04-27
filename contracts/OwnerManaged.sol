// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

contract OwnerManaged {
    address private contractOwner;

    constructor() public {
        contractOwner = msg.sender;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
}
