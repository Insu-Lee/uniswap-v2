import { ethers } from 'hardhat';
import { makeAbi } from './makeABI';

async function main() {
  const AToken = await ethers.getContractFactory('AToken');
  const BToken = await ethers.getContractFactory('BToken');

  console.log('Deploying Contract...');

  // Todo: 아래에 Proxy 컨트랙트와 V1 컨트랙트가 배포될 수 있도록 script를 완성시켜 주세요.
  const aToken = await AToken.deploy();
  await aToken.waitForDeployment();

  const bToken = await BToken.deploy();
  await bToken.waitForDeployment();

  /* setting */
  console.log('Contract deployed to:', aToken.target);
  await makeAbi('AToken', `${aToken.target}`);

  console.log('\nContract deployed to:', bToken.target);
  await makeAbi('BToken', `${bToken.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
