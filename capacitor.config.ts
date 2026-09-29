import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingdomgroup.poultry',
  appName: 'Kingdom Group Poultry',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    // Configure native status bar & splash screen
  }
};

export default config;
