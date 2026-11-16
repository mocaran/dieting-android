import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dieting.offline',
  appName: 'Dieting',
  webDir: 'dist',
  android: {
    allowMixedContent: false
  }
};

export default config;
