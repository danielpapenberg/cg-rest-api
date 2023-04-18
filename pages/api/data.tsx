import axios from 'axios';
import mysql from 'mysql2/promise';
import { NextApiRequest, NextApiResponse } from 'next';
import { PriceData } from '../../types/priceData';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
});

const getPriceData = async (): Promise<PriceData> => {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
  const now = new Date();
  const priceData = {
    price: response.data.bitcoin.usd,
    name: 'bitcoin',
    timestamp: now.getTime()
  };
  const connection = await pool.getConnection();
  const sql = 'UPDATE cg_price SET price="' + priceData.price + '", timestamp="' + priceData.timestamp + '" WHERE name="' + priceData.name + '"';
  try {
    await connection.query(sql, []);
    console.log('Inserted new price data into MySQL database.');
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
  }

  return priceData;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<PriceData>) {
  const connection = await pool.getConnection();
  const sql = 'SELECT * FROM cg_price';
  try {
    const [rows] = await connection.query(sql);
    const priceData: PriceData = rows[0];
    const now = new Date();
    const thirtySecondsAgo = now.getTime() - 30 * 1000; // 30 seconds ago
    if (priceData.timestamp < thirtySecondsAgo) {
      console.log('jo')
      const newPriceData = await getPriceData();
      res.status(200).json(newPriceData);
    } else {
      res.status(200).json(priceData);
    }
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
  }
}
