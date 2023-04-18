import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../types/priceData';

const dataFilePath = path.join(process.cwd(), 'json', 'data.json');


const getPriceData = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
  const now = new Date();
  const priceData: PriceData = {
    bitcoin: response.data.bitcoin.usd,
    ethereum: response.data.ethereum.usd,
    timestamp: now.toISOString(),
  };
  fs.writeFileSync(dataFilePath, JSON.stringify(priceData));
  return priceData;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<PriceData>) {
  const data = fs.readFileSync(dataFilePath).toString();
  const priceData: PriceData = JSON.parse(data);
  const now = new Date();
  const proofDate = new Date(priceData.timestamp);
  const thirtySecondsAgo = now.getTime() - 30 * 1000; // 30 seconds ago
  if (proofDate.getTime() < thirtySecondsAgo) {
    const newPriceData = await getPriceData();
    res.status(200).json(newPriceData);
  } else {
    res.status(200).json(priceData);
  }
}
