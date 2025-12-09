import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nervi.app',
  appName: 'Nervi',
  webDir: 'out', // Next.js static export directory
  server: {
    // In production, load the live website
    // For local testing, comment this out and use localhost
    url: 'https://nervi.app',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Nervi'
  }
};

export default config;
