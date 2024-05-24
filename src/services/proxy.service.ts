import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { supabase } from "../config/supabase";

export const testProxyConnection = async (
  proxyHost: string,
  proxyPort: string,
  proxyUsername: string,
  proxyPassword: string
) => {
  // Create an instance of the proxy agent
  const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;
  const agent = new HttpsProxyAgent(proxyUrl);

  let axiosInstance: any;
  try {
    // Configure axios to use the proxy
    axiosInstance = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      proxy: false, // Disables the default proxy setting to use the agent instead
    });
  } catch (error) {
    console.error("Error:", error);
    return false;
  }

  const testUrl = "https://api.ipify.org?format=json";

  // Make a test request
  try {
    const response = await axiosInstance.get(testUrl);
    console.log("Response data:", response.data);
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};

export const saveProxyConfiguration = async ({
  proxyName,
  proxyHost,
  proxyPort,
  proxyUsername,
  proxyPassword,
}: {
  proxyName: string;
  proxyHost: string;
  proxyPort: string;
  proxyUsername: string;
  proxyPassword: string;
}) => {
  try {
    let { data, error } = await supabase.from("proxies").insert([
      {
        proxy_name: proxyName,
        proxy_domain: `http://${proxyHost}:${proxyPort}`,
        proxy_username: proxyUsername,
        proxy_password: proxyPassword,
      },
    ]);
    if (error) throw error;
  } catch (error) {
    console.error("Error saving proxy configuration:", error);
    throw new Error("Error saving proxy configuration");
  }
};
