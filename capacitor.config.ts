import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fptrades.portal',
  appName: 'FP Trades',
  webDir: 'build', // not used when server.url present
  server: {
    url: 'https://user.fptradess.com',
    cleartext: false
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#000000"
    }
  }
};

export default config;
