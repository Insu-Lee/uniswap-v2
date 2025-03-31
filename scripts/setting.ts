import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { askToContinue, delay } from './process';

import AToken from '../abis/AToken.json';
import BToken from '../abis/BToken.json';
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

async function main() {
  try {
    console.log('\n\nChapter 2 - 셋팅');
    console.log(
      '\nuniswapV2 두번째 챕터는 셋팅입니다.\nUniswap V2 스타일의 라우터 컨트랙트를 사용하여 두 토큰을 유동성 풀에 예치하는 전체 과정을 따라가봅니다.'
    );

    await delay(1000);

    console.log('\n\nStep 1: Approve');
    console.log(
      'Router 컨트랙트가 토큰을 이동시킬 수 있도록 각 토큰(A, B)에 대한 허가(Approve)를 받아야 합니다.'
    );
    await askToContinue();
    console.log(`
        const aApprove = await aToken.approve(router.target, token1000);
        await aApprove.wait();

        const bApprove = await bToken.approve(router.target, token1000);
        await bApprove.wait();
        `);
    console.log('⏳ Approve 실행 중... 잠시만 기다려주세요.');

    // 라우터 컨트랙트를 통해 유동성 풀에 SimpleToken의 토큰을 예치하려고 합니다. 따라서 라우터 컨트랙트가 SimpleToken의 토큰을 가지고 유동성 풀을 만들 수 있도록, 토큰을 approve 해주어야 합니다.
    const aApprove = await aToken.approve(router.target, token1000);
    await aApprove.wait();

    const bApprove = await bToken.approve(router.target, token1000);
    await bApprove.wait();

    console.log('\nOwner가 Router에게 허가(Approve)한 양');
    console.log(
      'Atoken : ',
      ethers.formatEther(await aToken.allowance(owner.address, router.target))
    );
    console.log(
      'Btoken : ',
      ethers.formatEther(await bToken.allowance(owner.address, router.target))
    );
    await askToContinue();

    console.log('\n\nStep 2: 슬리피지 설정');
    console.log(
      '슬리피지(Slippage)란, 거래 중 가격 변동으로 인해 손해를 방지하기 위해 설정하는 허용 범위입니다.\nUniswap은 공급 시점의 풀 상태에 따라 토큰 비율이 결정되기 때문에, 일정 범위 이상 변동이 생기면 트랜잭션을 실패시키게 됩니다.'
    );

    const SLIPPAGE_PERCENT = 1; // 1%
    console.log(`\n➡️ 현재 설정된 슬리피지: ${SLIPPAGE_PERCENT}%`);

    const { _reserve0, _reserve1 } = await pair.getReserves();
    const token0 = await pair.token0();
    const isAFirst =
      token0.toLowerCase() === aToken.target.toString().toLowerCase();

    const reserveA = isAFirst ? _reserve0 : _reserve1;
    const reserveB = isAFirst ? _reserve1 : _reserve0;

    // A 1000개 공급 시, 필요한 B 수량은?
    const amountADesired = ethers.parseEther('1000');
    let amountBDesired: bigint;
    let amountAMin: bigint;
    let amountBMin: bigint;

    if (reserveA === 0n || reserveB === 0n) {
      console.log(
        '⚠️ 현재 유동성 풀이 비어 있어 최초 공급자로서 직접 비율을 설정합니다.'
      );
      amountBDesired = ethers.parseEther('1000');
      amountAMin = (amountADesired * BigInt(99)) / 100n;
      amountBMin = (amountBDesired * BigInt(99)) / 100n;
    } else {
      amountBDesired = (amountADesired * reserveB) / reserveA;
      amountAMin = (amountADesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
      amountBMin = (amountBDesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
    }

    console.log(`🧮 슬리피지 하한 계산 예시:
        - 희망 공급량 A: 1000 → 최소 ${ethers.formatEther(amountAMin)} A
        - 희망 공급량 B: ${ethers.formatEther(
          amountBDesired
        )} → 최소 ${ethers.formatEther(amountBMin)} B`);

    await askToContinue();

    console.log(`
        const SLIPPAGE_PERCENT = 1; // 1%

        const { _reserve0, _reserve1 } = await pair.getReserves();
        const token0 = await pair.token0();
        const isAFirst =
        token0.toLowerCase() === aToken.target.toString().toLowerCase();

        const reserveA = isAFirst ? _reserve0 : _reserve1;
        const reserveB = isAFirst ? _reserve1 : _reserve0;

        const amountADesired = ethers.parseEther('1000');
        const amountBDesired = (amountADesired * reserveB) / reserveA;

        const amountAMin = (amountADesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
        const amountBMin = (amountBDesired * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
        `);

    const aBalance = await aToken.balanceOf(owner.address);
    const bBalance = await bToken.balanceOf(owner.address);

    await askToContinue();

    console.log('\n\n Step 3: 유동성 풀에 토큰 예치');
    console.log(
      'addLiquidity() 함수 실행으로 실제 유동성 풀에 A, B 토큰을 예치합니다.'
    );
    console.log(
      '\n유동성 공급 전 Owner의 AToken 잔액 : ',
      ethers.formatEther(aBalance)
    );
    console.log(
      '유동성 공급 전 Owner의 BToken 잔액 : ',
      ethers.formatEther(bBalance)
    );
    await askToContinue();

    console.log(`\n
        const addLiquidity = await router.addLiquidity(
            aToken.target, // A 토큰
            bToken.target, // B 토큰
            amountADesired, // A 토큰의 공급량
            amountBDesired, // B 토큰의 공급량
            amountAMin, // A 토큰의 최소 공급량
            amountBMin, // B 토큰의 최소 공급량
            owner.address // Owner
        );
        await addLiquidity.wait();
        `);

    console.log('⏳ addLiquidity 실행 중... 잠시만 기다려주세요.');

    const addLiquidity = await router.addLiquidity(
      aToken.target,
      bToken.target,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      owner.address
    );
    await addLiquidity.wait();

    const afterABalance = await aToken.balanceOf(owner.address);
    const afterBBalance = await bToken.balanceOf(owner.address);
    console.log(
      '\n유동성 공급 후 Owner의 AToken 잔액 : ',
      ethers.formatEther(afterABalance)
    );
    console.log(
      '유동성 공급 후 Owner의 BToken 잔액 : ',
      ethers.formatEther(afterBBalance)
    );

    await delay(1000);

    console.log('\n\n Step 4: LP 토큰 수령');
    console.log(
      'LP Token은 유동성 풀에 기여한 만큼의 지분을 나타내는 토큰입니다. 이 토큰을 나중에 반납하면 예치했던 토큰과 수수료 수익을 돌려받을 수 있습니다.'
    );
    console.log(
      'addLiquidity() 함수 실행으로 유동성 풀에 예치가 완료 되었습니다.\n예치의 대가로 받은 LP 토큰 수량 확인하겠습니다.'
    );
    console.log(
      '\nLP Token은 Pair 컨트랙트에서 발행합니다. Pair 컨트랙트를 통해 LP 토큰의 수량을 확인합니다.'
    );
    await askToContinue();

    console.log(`\n
        const lpBalance = await pair.balanceOf(owner.address);
    `);

    // 생성된 LP 토큰 확인
    const lpBalance = await pair.balanceOf(owner.address);
    console.log('💧 LP Token Balance:', ethers.formatEther(lpBalance));

    await delay(1000);

    console.log(
      '\n챕터 2가 완료되었습니다. 챕터 3을 시작하려면 다음의 명령어를 이용하세요.'
    );
    console.log('npm run swap');
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
