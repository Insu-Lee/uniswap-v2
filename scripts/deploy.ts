import { ethers } from 'hardhat';
import { makeAbi } from './makeABI';
import { askToContinue } from './process';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY || '';

async function main() {
  console.log(
    'UniswapV2 실습을 시작합니다. 이번 실습에서는 코딩 보다는 단계별 코드 파악에 집중해주세요.'
  );
  console.log(
    '전체 과정 : 유동성 풀을 만들어 임의의 ERC20 토큰을 예치 후 스왑. 예치된 토큰을 풀에서 제거'
  );
  console.log(
    '(모든 프로세스는 학습자의 파악을 위해 의도적인 딜레이가 주어집니다.)'
  );
  await askToContinue();

  const provider = ethers.provider;
  const owner = new ethers.Wallet(privateKey, provider);

  let pairContract: string = '';

  const AToken = await ethers.getContractFactory('AToken');
  const BToken = await ethers.getContractFactory('BToken');
  const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory');
  const UniswapV2Router02 = await ethers.getContractFactory(
    'UniswapV2Router02'
  );

  console.log('\n\nChapter 1 - 배포');
  console.log(
    '\nuniswapV2 첫번째 챕터는 배포입니다.\nContract 1. 스왑할 토큰A\nContract 2. 스왑할 토큰B\nContract 3. Uniswap의 유동성 풀을 생성하는 Factory\nContract 4. 거래와 유동성 관련 기능을 중개하는 라우터(Router)\nContract 5. 토큰 A와 B의 유동성 풀(Pair)'
  );

  const aToken = await AToken.deploy();
  await aToken.waitForDeployment();

  const bToken = await BToken.deploy();
  await bToken.waitForDeployment();

  const factory = await UniswapV2Factory.deploy(owner.address);
  await factory.waitForDeployment();

  const router = await UniswapV2Router02.deploy(factory.target);
  await router.waitForDeployment();

  console.log('\nContract TokenA deployed to:', aToken.target);
  await makeAbi('AToken', `${aToken.target}`);

  console.log('\nContract TokenB deployed to:', bToken.target);
  await makeAbi('BToken', `${bToken.target}`);

  console.log('\nContract Factory deployed to:', factory.target);
  await makeAbi('UniswapV2Factory', `${factory.target}`);

  console.log('\nContract deployed to:', router.target);
  await makeAbi('UniswapV2Router02', `${router.target}`);

  /* setting */
  console.log(
    '\n\nTokenA와 TokenB를 이용한 유동성 풀을 생성합니다.\n유동성 풀은 hardhat으로 배포하는 것이 아닌 Factory에서 코드로 배포가 됩니다.\n유동성 풀을 배포하기 위해선 Factory의 createPair 함수를 사용해야 합니다.'
  );
  await askToContinue();

  console.log(`
    const createPair = await factory.createPair(aToken.target, bToken.target);
    const receipt = await createPair.wait();
    `);

  const createPair = await factory.createPair(aToken.target, bToken.target);
  const receipt = await createPair.wait();
  if (receipt) {
    const event = receipt.logs
      .map((log) => {
        try {
          return factory.interface.parseLog(log);
        } catch (_) {
          return null;
        }
      })
      .find((parsed) => parsed?.name === 'PairCreated');

    if (event) {
      console.log(`✅ PairCreated: pair at ${event.args.pair}`);
      pairContract = event.args.pair;
    }
  }

  console.log('\nContract Pair deployed to:', pairContract);
  await makeAbi('UniswapV2Pair', `${pairContract}`);

  console.log(
    '\n\n챕터 1이 완료되었습니다. 챕터 2를 시작하려면 다음의 명령어를 이용하세요.'
  );
  console.log('npm run setting');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
