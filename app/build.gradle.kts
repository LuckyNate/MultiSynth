plugins {
    id("com.android.application")
}

android {
    namespace = "audio.multisynth.app"
    compileSdk = 35

    val signingStore = System.getenv("MULTISYNTH_KEYSTORE_PATH")
    val signingStorePassword = System.getenv("MULTISYNTH_KEYSTORE_PASSWORD")
    val signingAlias = System.getenv("MULTISYNTH_KEY_ALIAS")
    val signingKeyPassword = System.getenv("MULTISYNTH_KEY_PASSWORD")
    val hasCiSigning = listOf(signingStore, signingStorePassword, signingAlias, signingKeyPassword).all { !it.isNullOrBlank() }
    val youtubeApiKey = (System.getenv("YOUTUBE_API_KEY") ?: "").replace("\\", "\\\\").replace("\"", "\\\"")

    if (hasCiSigning) {
        signingConfigs {
            create("multisynthRelease") {
                storeFile = file(signingStore!!)
                storePassword = signingStorePassword
                keyAlias = signingAlias
                keyPassword = signingKeyPassword
            }
        }
    }

    defaultConfig {
        applicationId = "audio.multisynth.app"
        minSdk = 23
        targetSdk = 35

        val ciRun = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull()
        versionCode = ciRun ?: 18
        versionName = if (ciRun != null) "1.${ciRun}" else "1.17"
        buildConfigField("String", "YOUTUBE_API_KEY", "\"$youtubeApiKey\"")
    }

    buildTypes {
        getByName("debug") {
            if (hasCiSigning) signingConfig = signingConfigs.getByName("multisynthRelease")
        }
        getByName("release") {
            isMinifyEnabled = false
            if (hasCiSigning) signingConfig = signingConfigs.getByName("multisynthRelease")
        }
    }

    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {}
