import { ethers } from 'hardhat';
import { makeAbi } from './makeABI';
import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || '';

async function main() {
  const provider = ethers.provider;
  const owner = new ethers.Wallet(privateKey, provider);

  let pairContract: string = '';

  const AToken = await ethers.getContractFactory('AToken');
  const BToken = await ethers.getContractFactory('BToken');
  const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory');
  const UniswapV2Router02 = await ethers.getContractFactory(
    'UniswapV2Router02'
  );

  console.log('Deploying Contract...');

  const aToken = await AToken.deploy();
  await aToken.waitForDeployment();

  const bToken = await BToken.deploy();
  await bToken.waitForDeployment();

  const factory = await UniswapV2Factory.deploy(owner.address);
  await factory.waitForDeployment();

  const router = await UniswapV2Router02.deploy(factory.target);
  await router.waitForDeployment();

  console.log('Contract deployed to:', aToken.target);
  await makeAbi('AToken', `${aToken.target}`);

  console.log('\nContract deployed to:', bToken.target);
  await makeAbi('BToken', `${bToken.target}`);

  console.log('\nContract deployed to:', factory.target);
  await makeAbi('UniswapV2Factory', `${factory.target}`);

  console.log('\nContract deployed to:', router.target);
  await makeAbi('UniswapV2Router02', `${router.target}`);

  /* setting */
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
      console.log(`✅ 이벤트 확인: pair at ${event.args.pair}`);
      pairContract = event.args.pair;
    }
  }

  console.log('\nContract deployed to:', pairContract);
  await makeAbi('UniswapV2Pair', `${pairContract}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
