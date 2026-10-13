package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.local.TokenManager
import com.talentdafrique.app.data.remote.api.AuthApi
import com.talentdafrique.app.data.remote.dto.LoginRequest
import com.talentdafrique.app.data.remote.dto.RegisterRequest
import com.talentdafrique.app.data.remote.dto.TypeProfil
import com.talentdafrique.app.data.remote.dto.UserDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Résultat générique pour distinguer succès / erreur réseau dans l'UI,
 * sans exposer d'exception brute jusqu'aux Composables.
 */
sealed interface Result<out T> {
    data class Success<T>(val data: T) : Result<T>
    data class Error(val message: String) : Result<Nothing>
}

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager,
) {
    val isLoggedIn: Flow<Boolean> = tokenManager.isLoggedInFlow

    suspend fun login(email: String, motDePasse: String): Result<Unit> = try {
        val tokens = authApi.login(LoginRequest(email, motDePasse))
        tokenManager.saveTokens(tokens.accessToken, tokens.refreshToken)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.message ?: "Connexion impossible. Vérifie ton email et mot de passe.")
    }

    suspend fun register(
        nom: String,
        email: String,
        motDePasse: String,
        typeProfil: TypeProfil,
    ): Result<Unit> = try {
        val tokens = authApi.register(RegisterRequest(nom, email, motDePasse, typeProfil))
        tokenManager.saveTokens(tokens.accessToken, tokens.refreshToken)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.message ?: "Inscription impossible.")
    }

    suspend fun me(): Result<UserDto> = try {
        Result.Success(authApi.me())
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer le profil.")
    }

    suspend fun logout() {
        // Le backend ne peut pas invalider le refresh token avant son expiration
        // naturelle (limite connue, section 3 du récap backend) — on se contente
        // donc d'effacer les tokens localement.
        tokenManager.clear()
    }
}
