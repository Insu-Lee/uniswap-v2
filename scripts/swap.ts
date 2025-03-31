import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { askToContinue, delay } from './process';

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
const SLIPPAGE_PERCENT = 1; // 1%

async function main() {
  try {
    console.log('\n\nChapter 3 - 스왑');
    console.log(
      '\nuniswapV2 마지막 챕터는 스왑입니다.\nUniswap V2 스타일의 라우터 컨트랙트를 사용하여 예치된 토큰을 스왑 후 유동성 제거하는 과정을 따라가봅니다.'
    );

    await delay(1000);

    console.log('\n\nStep 1: Allowance 확인');
    console.log(
      '예치 과정으로 인해 허가(Approve)된 양이 줄어들었습니다. Swap 실행 전 전송을 위한 허가(Approve)를 실행합니다.'
    );

    await askToContinue();

    console.log(`
        if ((await aToken.allowance(owner.address, router.target)) < swapValue) {
          const aApprove = await aToken.approve(router.target, token1000);
          await aApprove.wait();
        }
    `);
    console.log('⏳ Approve 실행 중... 잠시만 기다려주세요.');

    if ((await aToken.allowance(owner.address, router.target)) < swapValue) {
      const aApprove = await aToken.approve(router.target, token1000);
      await aApprove.wait();
    }

    console.log('\n\nStep 2: Swap - 최소 수령량(minOut) 을 계산');
    console.log(
      'Uniswap은 AMM이기 때문에 가격이 유동성 풀의 상태에 따라 실시간으로 계산됩니다.\ngetAmountsOut()을 사용하면, 스왑 시 몇 개의 토큰을 받을 수 있을지 예측 가능합니다.'
    );
    console.log(
      '\n슬리피지(허용 오차) 설정에 기반한 최소 수령량(minOut) 을 계산하겠습니다.'
    );

    // 토큰 스왑
    const prevSwapABalance = await aToken.balanceOf(owner.address);
    const prevSwapBBalance = await bToken.balanceOf(owner.address);

    await askToContinue();

    console.log(`
        const amountsOut = await router.getAmountsOut(swapValue, [
            aToken.target,
            bToken.target,
        ]);
        const minOut = (amountsOut[1] * 99n) / 100n;
    `);

    const amountsOut = await router.getAmountsOut(swapValue, [
      aToken.target,
      bToken.target,
    ]);
    const minOut = (amountsOut[1] * 99n) / 100n;

    console.log('\n\nStep 3: Swap');
    console.log(
      'swapExactTokensForTokens() 함수를 이용하여 Swap을 실행합니다.'
    );

    await askToContinue();

    console.log(
      '\n스왑 전 Owner의 AToken 잔액 : ',
      ethers.formatEther(prevSwapABalance)
    );
    console.log(
      '스왑 전 Owner의 BToken 잔액 : ',
      ethers.formatEther(prevSwapBBalance)
    );

    console.log(`
        const swapExactTokensForTokens = await router.swapExactTokensForTokens(
            swapValue, // 스왑할 양
            minOut, // 최소 수령량(minOut)
            [aToken.target, bToken.target], // 토큰 스왑 경로(path)
            owner.address // 스왑할 주소
        );
        await swapExactTokensForTokens.wait();
    `);
    console.log('⏳ swapExactTokensForTokens 실행 중... 잠시만 기다려주세요.');

    const swapExactTokensForTokens = await router.swapExactTokensForTokens(
      swapValue,
      minOut,
      [aToken.target, bToken.target],
      owner.address
    );
    await swapExactTokensForTokens.wait();

    const afterSwapABalance = await aToken.balanceOf(owner.address);
    const afterSwapBBalance = await bToken.balanceOf(owner.address);
    console.log(
      '\n스왑 후 Owner의 AToken 잔액 : ',
      ethers.formatEther(afterSwapABalance)
    );
    console.log(
      '스왑 후 Owner의 BToken 잔액 : ',
      ethers.formatEther(afterSwapBBalance)
    );

    await askToContinue();

    console.log('\n\nStep 4: 유동성 제거 준비 - Approve');
    console.log(
      'Uniswap V2 유동성 풀에서 유동성을 제거하기 위한 준비 작업을 진행합니다. 먼저, Pair 컨트랙트가 나의 LP 토큰을 이동할 수 있도록 Approve를 실행 시켜줍니다.'
    );

    await askToContinue();

    console.log(`
        const approveLP = await pair.approve(router.target, prevSwapLPBalance); // 모든 잔액을 approve
        await approveLP.wait();
    `);
    console.log('⏳ approve 실행 중... 잠시만 기다려주세요.');

    const reserves = await pair.getReserves();
    const totalSupply = await pair.totalSupply();
    const prevSwapLPBalance = await pair.balanceOf(owner.address);

    const approveLP = await pair.approve(router.target, prevSwapLPBalance);
    await approveLP.wait();

    console.log(
      '\n\nStep 5: 유동성 제거 준비 - LP 비율 계산 (내가 예치한 만큼 LP를 얼마나 돌려받을지)'
    );
    console.log(
      'LP 비율 계산하여 내가 얼마나 돌려받을 수 있을지 계산해보겠습니다.'
    );

    await askToContinue();

    console.log(`
        const reserves = await pair.getReserves();              // 유동성 풀 안의 A, B 토큰 수량
        const totalSupply = await pair.totalSupply();           // 전체 발행된 LP 토큰 수
        const prevSwapLPBalance = await pair.balanceOf(owner.address); // 내가 가진 LP 
        
        // A, B 토큰이 어떤 순서로 저장되어 있는지 확인(토큰이 token0 인지 token1 인지에 따라 리저브 할당)
        const token0 = await pair.token0();
        const isAFirst = token0.toLowerCase() === aToken.target.toString().toLowerCase();

        const reserveA = isAFirst ? reserves._reserve0 : reserves._reserve1;
        const reserveB = isAFirst ? reserves._reserve1 : reserves._reserve0;

        // 내가 가진 LP 토큰에 해당하는 A, B 토큰 수령가능한 수량 계산
        const expectedAmountA = (reserveA * prevSwapLPBalance) / totalSupply;
        const expectedAmountB = (reserveB * prevSwapLPBalance) / totalSupply;
    `);

    // token0 기준으로 reserve 정렬
    const token0 = await pair.token0();
    const isAFirst =
      token0.toLowerCase() === aToken.target.toString().toLowerCase();

    const reserveA = isAFirst ? reserves._reserve0 : reserves._reserve1;
    const reserveB = isAFirst ? reserves._reserve1 : reserves._reserve0;

    // 내가 보유한 LP 토큰에 해당하는 예상 수령량
    const expectedAmountA = (reserveA * prevSwapLPBalance) / totalSupply;
    const expectedAmountB = (reserveB * prevSwapLPBalance) / totalSupply;

    console.log('\n예상 수령량');
    console.log(
      `예상 AToken 수령량 : ${ethers.formatEther(expectedAmountA)} A`
    );
    console.log(
      `예상 BToken 수령량 : ${ethers.formatEther(expectedAmountB)} B`
    );

    await askToContinue();

    // 슬리피지 1% 적용
    const amountALPMin =
      (BigInt(expectedAmountA) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;
    const amountBLPMin =
      (BigInt(expectedAmountB) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;

    console.log('\n\nStep 6: 유동성 제거');
    console.log('removeLiquidity() 함수 실행으로 예치한 유동성을 제거합니다.');

    await askToContinue();

    console.log(
      '유동성 제거 전 LP Token 잔액 : ',
      ethers.formatEther(prevSwapLPBalance)
    );

    console.log(`
        // 슬리피지 1% 적용
        const amountALPMin =
        (BigInt(expectedAmountA) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;
        const amountBLPMin =
        (BigInt(expectedAmountB) * (100n - BigInt(SLIPPAGE_PERCENT))) / 100n;

        const removeLiquidity = await router.removeLiquidity(
            aToken.target,
            bToken.target,
            prevSwapLPBalance,
            amountALPMin,
            amountBLPMin,
            owner.address
        );
        await removeLiquidity.wait();
    `);

    console.log('⏳ removeLiquidity 실행 중... 잠시만 기다려주세요.');

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
      '유동성 제거 후 LP Token 잔액 : ',
      ethers.formatEther(afterSwapLPBalance)
    );

    const afterLPSwapABalance = await aToken.balanceOf(owner.address);
    const afterLPSwapBBalance = await bToken.balanceOf(owner.address);
    console.log(
      '유동성 제거 후 A발란스 : ',
      ethers.formatEther(afterLPSwapABalance)
    );
    console.log(
      '유동성 제거 후 B발란스 : ',
      ethers.formatEther(afterLPSwapBBalance)
    );

    await delay(1000);

    console.log('\n유동성 제거가 성공적으로 완료되었습니다.');
    console.log('🎉 Uniswap V2 전체 흐름이 완료되었습니다.');
  } catch (error: any) {
    if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
      console.log(
        '\n\n❗ UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT 오류가 발생했습니다.\nnpm run setting 을 실행하여주세요.'
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
