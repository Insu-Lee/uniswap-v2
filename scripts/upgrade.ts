import { ethers as hre } from 'hardhat'; // hardhat을 사용할 때 hre 라는 이름으로 사용합니다.
import { makeAbi } from './makeABI';
import { ethers } from 'ethers';
import { admin } from '../helper/test.helper';

import Proxy from '../abis/Proxy.json';

async function main() {
  const proxy = new ethers.Contract(Proxy.address, Proxy.abi, admin);
  const V2 = await hre.getContractFactory('V2');

  console.log('Deploying Contract...');

  /*
    Todo: 배포 스크립트(hardhat 사용)와 업그레이드(ethers 사용)를 완성시켜 주세요.

    1) V2 컨트랙트를 배포하기 위한 스크립트를 완성 시킵니다.
    2) 업그레이드를 실행합니다. Proxy 컨트랙트에서 upgrade 함수를 실행시켜야 합니다. 
  */
  const v2;

  /* setting */
  console.log('Contract deployed to:', v2.target);
  await makeAbi('V2', `${proxy.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
