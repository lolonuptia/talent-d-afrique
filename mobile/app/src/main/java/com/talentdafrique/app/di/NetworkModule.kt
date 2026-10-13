package com.talentdafrique.app.di

import android.content.Context
import android.os.Build
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.talentdafrique.app.BuildConfig
import com.talentdafrique.app.data.remote.AuthInterceptor
import com.talentdafrique.app.data.remote.TokenAuthenticator
import com.talentdafrique.app.data.remote.api.AuthApi
import com.talentdafrique.app.data.remote.api.CandidaturesApi
import com.talentdafrique.app.data.remote.api.CvApi
import com.talentdafrique.app.data.remote.api.NotificationsApi
import com.talentdafrique.app.data.remote.api.OffresApi
import com.talentdafrique.app.data.remote.api.ProfilesApi
import com.talentdafrique.app.data.remote.api.UsersApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideContext(@ApplicationContext context: Context): Context = context

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        tokenAuthenticator: TokenAuthenticator,
    ): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .authenticator(tokenAuthenticator)
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private fun isEmulator(): Boolean {
        return Build.FINGERPRINT.startsWith("generic")
            || Build.FINGERPRINT.startsWith("unknown")
            || Build.MODEL.contains("google_sdk")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            || Build.MANUFACTURER.contains("Genymotion")
            || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
            || "google_sdk" == Build.PRODUCT
            || Build.PRODUCT.contains("sdk_gphone")
            || Build.PRODUCT.contains("emulator")
            || Build.MODEL.contains("sdk_gphone")
            || Build.HARDWARE.contains("ranchu")
            || Build.HARDWARE.contains("goldfish")
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, moshi: Moshi): Retrofit =
        Retrofit.Builder()
            .baseUrl(if (isEmulator()) BuildConfig.BASE_URL else BuildConfig.DEVICE_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)

    @Provides
    @Singleton
    fun provideUsersApi(retrofit: Retrofit): UsersApi = retrofit.create(UsersApi::class.java)

    @Provides
    @Singleton
    fun provideProfilesApi(retrofit: Retrofit): ProfilesApi = retrofit.create(ProfilesApi::class.java)

    @Provides
    @Singleton
    fun provideCvApi(retrofit: Retrofit): CvApi = retrofit.create(CvApi::class.java)

    @Provides
    @Singleton
    fun provideOffresApi(retrofit: Retrofit): OffresApi = retrofit.create(OffresApi::class.java)

    @Provides
    @Singleton
    fun provideCandidaturesApi(retrofit: Retrofit): CandidaturesApi =
        retrofit.create(CandidaturesApi::class.java)

    @Provides
    @Singleton
    fun provideNotificationsApi(retrofit: Retrofit): NotificationsApi =
        retrofit.create(NotificationsApi::class.java)
}