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
      overlay: false
    }
  }
};

export default config;
