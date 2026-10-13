package com.talentdafrique.app.data.remote

import com.squareup.moshi.Moshi
import com.talentdafrique.app.BuildConfig
import com.talentdafrique.app.data.local.TokenManager
import com.talentdafrique.app.data.remote.dto.RefreshRequest
import com.talentdafrique.app.data.remote.dto.TokenResponse
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Se déclenche automatiquement quand le serveur répond 401 (access token
 * expiré, durée de vie 30 min côté backend). Appelle POST /auth/refresh
 * avec le refresh token (7 jours), et si ça marche, rejoue la requête
 * d'origine avec le nouveau access token — de façon totalement transparente
 * pour le reste de l'app.
 *
 * Si le refresh échoue aussi (refresh token expiré ou invalidé), on efface
 * les tokens : l'app doit alors rediriger vers l'écran de login (voir
 * TokenManager.isLoggedInFlow observé depuis la racine de la navigation).
 */
@Singleton
class TokenAuthenticator @Inject constructor(
    private val tokenManager: TokenManager,
    private val moshi: Moshi,
) : Authenticator {

    // Client HTTP nu, séparé de celui utilisé partout ailleurs, pour éviter
    // une boucle infinie (sinon cet appel repasserait par ce même Authenticator).
    private val plainClient = OkHttpClient.Builder().build()

    override fun authenticate(route: Route?, response: Response): Request? {
        // Évite de boucler si on a déjà tenté un refresh sur cette requête
        if (responseCount(response) >= 2) return null

        val refreshToken = runBlocking { tokenManager.getRefreshToken() } ?: return null

        val newAccessToken = runBlocking { doRefresh(refreshToken) } ?: run {
            runBlocking { tokenManager.clear() }
            return null
        }

        return response.request.newBuilder()
            .header("Authorization", "Bearer $newAccessToken")
            .build()
    }

    private suspend fun doRefresh(refreshToken: String): String? {
        return try {
            val adapter = moshi.adapter(RefreshRequest::class.java)
            val body = adapter.toJson(RefreshRequest(refreshToken))
                .toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(BuildConfig.BASE_URL + "auth/refresh")
                .post(body)
                .build()

            val response = plainClient.newCall(request).execute()
            if (!response.isSuccessful) return null

            val responseBody = response.body?.string() ?: return null
            val tokenAdapter = moshi.adapter(TokenResponse::class.java)
            val tokens = tokenAdapter.fromJson(responseBody) ?: return null

            tokenManager.saveTokens(tokens.accessToken, tokens.refreshToken)
            tokens.accessToken
        } catch (e: Exception) {
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var result = 1
        var prior = response.priorResponse
        while (prior != null) {
            result++
            prior = prior.priorResponse
        }
        return result
    }
}
