plugins {
    id("com.android.application")
}

android {
    namespace = "audio.multisynth.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "audio.multisynth.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 3
        versionName = "1.2"
    }

    buildFeatures { buildConfig = false }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {}
