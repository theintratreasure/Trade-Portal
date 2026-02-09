import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alstrades.portal',
  appName: 'Trade Portal',
  webDir: 'build', // not used when server.url present
  server: {
    url: 'https://trade-portal-uiub.vercel.app',
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
