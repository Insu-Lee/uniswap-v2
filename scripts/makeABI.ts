import fs from 'fs';
import path from 'path';

const basePath = __dirname;

let base = path.join(basePath, '../');

const makeFile = async (
  location: string,
  destination: string,
  address: string
) => {
  console.log(
    '다음 경로에 abi파일을 만듭니다. : ',
    path.join(base, destination)
  );
  const json = await fs.readFileSync(path.join(base, location), {
    encoding: 'utf-8',
  });

  await fs.writeFileSync(path.join(base, destination), makeData(json, address));
};

const makeData = (json: string, address: string) => {
  const abi = JSON.parse(json).abi;

  return JSON.stringify({
    abi: abi,
    address: address,
  });
};

export const makeAbi = async (contract: string, address: string) => {
  await makeFile(
    `/artifacts/contracts/${contract}.sol/${contract}.json`,
    `/abis/${contract}.json`,
    address
  );
};
