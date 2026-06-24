// Dynamic config (replaces the old static app.json) so the aggressive,
// production-only native build tweaks below can be gated behind the EAS
// build profile. Development/preview builds keep full ABI support (so
// Android-emulator testing on x86_64 keeps working) and unminified code
// (for readable crashes); only the "production" profile — the one that
// actually gets installed by end users — picks up the size-reduction
// settings. eas.json sets APK_SIZE_OPTIMIZED=1 on that profile only.
const isProductionBuild = process.env.APK_SIZE_OPTIMIZED === "1";

// Keep rules for native modules that talk to JS over JNI/reflection rather
// than plain method calls — R8 can't see those call sites statically and
// will strip the classes/methods they need unless pinned down explicitly.
// Package names below were confirmed against this project's actual
// node_modules, not guessed.
const extraProguardRules = `
# React Native / Hermes / New Architecture core
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.common.internal.DoNotStrip *; }
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-dontwarn com.facebook.react.**

# Expo modules — bridged via JSI/reflection (see expo/expo#43567)
-keep class expo.modules.** { *; }
-keep class expo.core.** { *; }

# Reanimated / Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.common.** { *; }
-keep class com.swmansion.worklets.** { *; }

# Gesture handler / screens / svg
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.horcrux.svg.** { *; }

# NetInfo / DateTimePicker
-keep class com.reactnativecommunity.netinfo.** { *; }
-keep class com.reactcommunity.rndatetimepicker.** { *; }

# Bluetooth ESC/POS printer SDK
-keep class cn.jystudio.** { *; }
`;

module.exports = {
  expo: {
    name: "VumbaView Academy",
    slug: "Reception",
    version: "1.0.0",
    scheme: "reception",
    platforms: ["ios", "android"],
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-sqlite",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
            ...(isProductionBuild
              ? {
                  // Real phones are always arm; x86/x86_64 only exist for
                  // emulators. Dropping them roughly halves the duplicated
                  // native-library weight a universal APK otherwise ships.
                  buildArchs: ["armeabi-v7a", "arm64-v8a"],
                  // Re-compress native .so files inside the APK. Modern AGP
                  // stores them uncompressed by default for faster app
                  // start, which makes the .apk file itself bigger — worth
                  // trading away for a distributable file.
                  useLegacyPackaging: true,
                  // R8 code shrinking + unused-resource removal.
                  enableMinifyInReleaseBuilds: true,
                  enableShrinkResourcesInReleaseBuilds: true,
                  // Compresses the JS bundle inside the APK too. Slightly
                  // slower cold start in exchange for a smaller file.
                  enableBundleCompression: true,
                  extraProguardRules,
                }
              : {}),
          },
        },
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFFFFF",
          image: "./assets/images/splash-icon.png",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#000000",
          },
          imageWidth: 200,
        },
      ],
      "@react-native-community/datetimepicker",
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      package: "com.vumbaviewacademy.reception",
    },
    extra: {
      router: {},
      eas: {
        projectId: "8c0cb802-df38-4373-854f-795b1126251b",
      },
    },
  },
};
