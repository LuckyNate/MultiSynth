plugins {
    id("com.android.application")
}

android {
    namespace = "audio.multisynth.app"
    compileSdk = 35

    signingConfigs {
        create("multisynthDev") {
            storeFile = rootProject.file(".signing/multisynth-dev.jks")
            storePassword = "multisynth-dev"
            keyAlias = "multisynth"
            keyPassword = "multisynth-dev"
        }
    }

    defaultConfig {
        applicationId = "audio.multisynth.app"
        minSdk = 23
        targetSdk = 35

        val ciRun = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull()
        versionCode = ciRun ?: 18
        versionName = if (ciRun != null) "1.${ciRun}" else "1.17"
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("multisynthDev")
        }
    }

    buildFeatures { buildConfig = false }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {}
