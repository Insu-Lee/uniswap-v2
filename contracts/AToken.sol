// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AToken is ERC20 {
    constructor() ERC20("AAA", "AAA") {
        _mint(msg.sender, 100000000e18);
    }
}
