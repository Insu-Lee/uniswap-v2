import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.6',
      },
      {
        version: '0.8.20',
      },
    ],
  },
  networks: {
    ganache: {
      url: 'https://public-en-kairos.node.kaia.io',
      accounts: [process.env.PRIVATE_KEY || ''],
    },
  },
};

export default config;
