// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;

interface IUniswapV2Factory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint
    );

    // Protocol fee가 지불되는 주소를 반환 합니다.
    function feeTo() external view returns (address);
    // 거래 수수료 분배 구조를 제어하는 FeeSetter 계정을 반환합니다.
    function feeToSetter() external view returns (address);

    // 두 개의 토큰 pair pool 을 제공하는 컨트랙트의 주소이다.
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
    // allPairs 는 동적 배열로 선언되어 있다. int 를 넣으면 해당 인덱스의 pair 컨트랙트 주소가 반환된다.
    function allPairs(uint) external view returns (address pair);
    // allPairs 배열의 길이를 반환한다. 전체 pair pool 의 갯수이다.
    function allPairsLength() external view returns (uint);

    // 두 개의 토큰으로 이루어진 pair pool 을 생성한다.
    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair);

    // feeTo 의 주소를 변경한다.
    function setFeeTo(address) external;
    // feeToSetter 의 주소를 변경한다.
    function setFeeToSetter(address) external;
}
