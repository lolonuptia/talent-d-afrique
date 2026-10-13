package com.talentdafrique.app.data.remote

import com.talentdafrique.app.data.local.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * Ajoute automatiquement "Authorization: Bearer <access_token>" à chaque
 * requête sortante, sauf sur les routes publiques (login, register).
 */
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()

        val isPublicRoute = original.url.encodedPath.let {
            it.endsWith("/auth/login") ||
                it.endsWith("/auth/register") ||
                it.endsWith("/auth/refresh") ||
                it.endsWith("/health")
        }

        if (isPublicRoute) return chain.proceed(original)

        val token = runBlocking { tokenManager.getAccessToken() }

        val request = if (token != null) {
            original.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        return chain.proceed(request)
    }
}
