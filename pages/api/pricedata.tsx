import axios from 'axios';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../types/priceData';

const getPriceData = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
  const now = new Date();
  const priceData: PriceData = {
    bitcoin: response.data.bitcoin.usd,
    ethereum: response.data.ethereum.usd,
    timestamp: now.toISOString(),
  };
  fs.writeFileSync('./data/data.json', JSON.stringify(priceData));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ message: string }>) {
  getPriceData();
  res.status(200).json({ message: 'Price data updated' });
}