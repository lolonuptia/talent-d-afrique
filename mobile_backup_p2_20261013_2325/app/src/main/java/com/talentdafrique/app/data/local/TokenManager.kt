package com.talentdafrique.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "auth_tokens")

/**
 * Persiste les deux tickets (access + refresh) décrits dans app/core/security.py.
 *
 * Remarque sécurité : DataStore n'est pas chiffré nativement. Pour un vrai
 * lancement en production, envisage androidx.security:security-crypto
 * (EncryptedSharedPreferences) ou le Keystore Android pour le refresh token,
 * qui vit 7 jours et est donc plus sensible que l'access token (30 min).
 */
@Singleton
class TokenManager @Inject constructor(
    context: Context,
) {
    private val dataStore = context.dataStore

    private val accessTokenKey = stringPreferencesKey("access_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")

    val accessTokenFlow: Flow<String?> =
        dataStore.data.map { it[accessTokenKey] }

    val isLoggedInFlow: Flow<Boolean> =
        dataStore.data.map { it[accessTokenKey] != null }

    suspend fun getAccessToken(): String? = dataStore.data.first()[accessTokenKey]
    suspend fun getRefreshToken(): String? = dataStore.data.first()[refreshTokenKey]

    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        dataStore.edit { prefs ->
            prefs[accessTokenKey] = accessToken
            prefs[refreshTokenKey] = refreshToken
        }
    }

    suspend fun updateAccessToken(accessToken: String) {
        dataStore.edit { prefs -> prefs[accessTokenKey] = accessToken }
    }

    suspend fun clear() {
        dataStore.edit { it.clear() }
    }
}
