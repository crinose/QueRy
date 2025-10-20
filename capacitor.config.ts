import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ApplicationExample',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#e0e0e0',
      overlaysWebView: false
    }
  }
};

export default config;
