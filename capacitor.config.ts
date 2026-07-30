import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fptrades.portal',
  appName: 'Trade Portal',
  webDir: 'build', // not used when server.url present
  server: {
    url: 'https://user.fptrades.com',
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
