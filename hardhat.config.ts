import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.20',
      },
      { version: '0.8.29' },
    ],
  },
  networks: {
    kairos: {
      url: 'https://public-en-kairos.node.kaia.io',
      accounts: [process.env.PRIVATE_KEY || ''],
    },
  },
};

export default config;
