import { ethers } from 'ethers';
import dotenv from 'dotenv';
import AToken from '../abis/AToken.json';
import BToken from '../abis/BToken.json';
import UniswapV2Factory from '../abis/UniswapV2Factory.json';
import UniswapV2Router02 from '../abis/UniswapV2Router02.json';
import UniswapV2Pair from '../abis/UniswapV2Pair.json';

dotenv.config();

const provider = new ethers.JsonRpcProvider(
  'https://public-en-kairos.node.kaia.io'
);
const owner = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const aToken = new ethers.Contract(AToken.address, AToken.abi, owner);
const bToken = new ethers.Contract(BToken.address, BToken.abi, owner);
const factory = new ethers.Contract(
  UniswapV2Factory.address,
  UniswapV2Factory.abi,
  owner
);
const router = new ethers.Contract(
  UniswapV2Router02.address,
  UniswapV2Router02.abi,
  owner
);
const pair = new ethers.Contract(
  UniswapV2Pair.address,
  UniswapV2Pair.abi,
  owner
);

const token1000 = ethers.parseEther('1000');
const swapValue = ethers.parseEther('100');

async function main() {
  try {
    // 라우터 컨트랙트를 통해 유동성 풀에 SimpleToken의 토큰을 예치하려고 합니다. 따라서 라우터 컨트랙트가 SimpleToken의 토큰을 가지고 유동성 풀을 만들 수 있도록, 토큰을 approve 해주어야 합니다.
    const aApprove = await aToken.approve(router.target, token1000);
    await aApprove.wait();

    const bApprove = await bToken.approve(router.target, token1000);
    await bApprove.wait();

    //토큰 쌍 예치
    const SLIPPAGE_PERCENT = 1; // 1%

    const amountADesired = ethers.parseUnits('100', 18);
    const amountBDesired = ethers.parseUnits('200', 18);

    const amountAMin = (amountADesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
    const amountBMin = (amountBDesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;

    const aBalance = await aToken.balanceOf(owner.address);
    const bBalance = await bToken.balanceOf(owner.address);

    console.log('슬리피지 전 A발란스 : ', ethers.formatEther(aBalance));
    console.log('슬리피지 전 B발란스 : ', ethers.formatEther(bBalance));

    const addLiquidity = await router.addLiquidity(
      aToken.target,
      bToken.target,
      token1000,
      token1000,
      amountAMin,
      amountBMin,
      owner.address
    );
    await addLiquidity.wait();

    const afterABalance = await aToken.balanceOf(owner.address);
    const afterBBalance = await bToken.balanceOf(owner.address);
    console.log('슬리피지 후 A발란스 : ', ethers.formatEther(afterABalance));
    console.log('슬리피지 후 B발란스 : ', ethers.formatEther(afterBBalance));

    // 생성된 LP 토큰 확인
    const lpBalance = await pair.balanceOf(owner.address);
    console.log('💧 LP Token Balance:', ethers.formatEther(lpBalance));

    if ((await aToken.allowance(owner.address, router.target)) < swapValue) {
      const aApprove = await aToken.approve(router.target, token1000);
      await aApprove.wait();
    }

    // 토큰 스왑
    const prevSwapABalance = await aToken.balanceOf(owner.address);
    const prevSwapBBalance = await bToken.balanceOf(owner.address);
    console.log('스왑 전 A발란스 : ', ethers.formatEther(prevSwapABalance));
    console.log('스왑 전 B발란스 : ', ethers.formatEther(prevSwapBBalance));

    const amountsOut = await router.getAmountsOut(swapValue, [
      aToken.target,
      bToken.target,
    ]);
    const minOut = (amountsOut[1] * 99n) / 100n;
    const swapExactTokensForTokens = await router.swapExactTokensForTokens(
      swapValue,
      minOut,
      [aToken.target, bToken.target],
      owner.address
    );
    await swapExactTokensForTokens.wait();

    const afterSwapABalance = await aToken.balanceOf(owner.address);
    const afterSwapBBalance = await bToken.balanceOf(owner.address);
    console.log('스왑 후 A발란스 : ', ethers.formatEther(afterSwapABalance));
    console.log('스왑 후 B발란스 : ', ethers.formatEther(afterSwapBBalance));

    // LP 토큰 스왑
    const reserves = await pair.getReserves();
    const totalSupply = await pair.totalSupply();
    const prevSwapLPBalance = await pair.balanceOf(owner.address);
    console.log(
      'LP 스왑 전 LP발란스 : ',
      ethers.formatEther(prevSwapLPBalance)
    );

    const approveLP = await pair.approve(router.target, prevSwapLPBalance);
    await approveLP.wait();

    // token0 기준으로 reserve 정렬
    const token0 = await pair.token0();
    const isAFirst =
      token0.toLowerCase() === aToken.target.toString().toLowerCase();

    const reserveA = isAFirst ? reserves._reserve0 : reserves._reserve1;
    const reserveB = isAFirst ? reserves._reserve1 : reserves._reserve0;

    // 내가 보유한 LP 토큰에 해당하는 예상 수령량
    const expectedAmountA = (reserveA * prevSwapLPBalance) / totalSupply;
    const expectedAmountB = (reserveB * prevSwapLPBalance) / totalSupply;

    // 슬리피지 1% 적용
    const amountALPMin =
      (BigInt(expectedAmountA) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;
    const amountBLPMin =
      (BigInt(expectedAmountB) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;

    // 유동성 제거
    const removeLiquidity = await router.removeLiquidity(
      aToken.target,
      bToken.target,
      prevSwapLPBalance,
      amountALPMin,
      amountBLPMin,
      owner.address
    );
    await removeLiquidity.wait();

    const afterSwapLPBalance = await pair.balanceOf(owner.address);
    console.log(
      'LP 스왑 후 LP발란스 : ',
      ethers.formatEther(afterSwapLPBalance)
    );

    const afterLPSwapABalance = await aToken.balanceOf(owner.address);
    const afterLPSwapBBalance = await bToken.balanceOf(owner.address);
    console.log('스왑 후 A발란스 : ', ethers.formatEther(afterLPSwapABalance));
    console.log('스왑 후 B발란스 : ', ethers.formatEther(afterLPSwapBBalance));
  } catch (error) {
    console.log(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
