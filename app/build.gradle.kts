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

        // GitHub Actions run numbers are monotonically increasing and therefore
        // make every CI APK eligible to update the previous installed build.
        // Local builds retain the existing development version code.
        val ciRun = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull()
        versionCode = ciRun ?: 18
        versionName = if (ciRun != null) "1.${ciRun}" else "1.17"
    }

    buildFeatures { buildConfig = false }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {}
