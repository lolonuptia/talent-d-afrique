plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
    kotlin("plugin.serialization") version "1.9.24"
}

android {
    namespace = "com.talentdafrique.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.talentdafrique.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

        // URL utilisée sur l'émulateur Android (AVD) — 10.0.2.2 pointe vers le localhost du PC hôte
        buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:8000/api/\"")
        // URL utilisée sur un appareil physique — IP locale du PC sur le réseau WiFi
        // À mettre à jour si l'IP du PC change (vérifier avec `ipconfig`)
        buildConfigField("String", "DEVICE_BASE_URL", "\"http://192.168.1.4:8000/api/\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
        debug {
            buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:8000/api/\"")
            buildConfigField("String", "DEVICE_BASE_URL", "\"http://192.168.1.4:8000/api/\"")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Core / Compose
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")

    // Hilt (injection de dépendances)
    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Retrofit + OkHttp (réseau)
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.moshi:moshi:1.15.1")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    ksp("com.squareup.moshi:moshi-kotlin-codegen:1.15.1")

    // DataStore (stockage sécurisé-ish des tokens)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Coil (chargement d'images, ex: logo entreprise)
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Sélection de fichier PDF pour l'upload de CV
    implementation("androidx.activity:activity-ktx:1.9.1")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.06.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
}