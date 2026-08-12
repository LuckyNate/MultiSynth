plugins {
    id("com.android.application")
}

android {
    namespace = "audio.quadsynth.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "audio.quadsynth.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures { buildConfig = false }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {}
