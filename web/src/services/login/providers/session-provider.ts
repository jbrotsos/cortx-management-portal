import request from "request-promise";
import dotenv from "dotenv";

dotenv.config();
export const getSessionKeys = async (user: string) => {
  // const coreUrl = process.env.core_url;
  const key = process.env.SESSION_KEY;
  // const url = `https://${coreUrl}?q=${user}`;
  // const response = await request(url);
  console.log(`{username:"${user}",token:"${key}"}`);
  return JSON.parse(`{"username":"${user}","token":"${key}"}`);
};