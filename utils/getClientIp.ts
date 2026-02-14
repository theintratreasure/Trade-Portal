export const getClientIp = async (): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error("IP fetch failed", error);
    return "UNKNOWN";
  } finally {
    clearTimeout(timeout);
  }
};
