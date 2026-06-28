import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.musicsite.ios",
  appName: "Music Site",
  webDir: "dist",
  backgroundColor: "#0A0A0F",
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    // Disable native navigation overrides; SPA handles routing.
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
