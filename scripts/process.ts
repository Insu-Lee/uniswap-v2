import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

export async function askToContinue(
  message: string = '\n계속 진행하려면 Enter를 누르세요.'
): Promise<void> {
  const answer = await rl.question(message);
  const proceed = answer.trim() === '' || answer.trim().toLowerCase() === 'y';
  if (!proceed) {
    console.log('사용자에 의해 중단되었습니다.');
    rl.close();
    process.exit(0);
  }
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
