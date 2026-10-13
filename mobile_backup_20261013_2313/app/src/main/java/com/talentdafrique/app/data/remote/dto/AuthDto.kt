package com.talentdafrique.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Ces DTO reflètent app/schemas/user.py côté backend.
 * Adapte les noms de champs exacts en regardant /docs (Swagger) de ton API si besoin —
 * je pars des conventions habituelles FastAPI/Pydantic en snake_case.
 */

enum class TypeProfil {
    @Json(name = "etudiant") ETUDIANT,
    @Json(name = "entreprise") ENTREPRISE,
    @Json(name = "ecole") ECOLE,
    @Json(name = "freelance") FREELANCE,
}

@JsonClass(generateAdapter = true)
data class RegisterRequest(
    val nom: String,
    val email: String,
    @Json(name = "mot_de_passe") val motDePasse: String,
    @Json(name = "type_profil") val typeProfil: TypeProfil,
)

@JsonClass(generateAdapter = true)
data class LoginRequest(
    val email: String,
    @Json(name = "mot_de_passe") val motDePasse: String,
)

@JsonClass(generateAdapter = true)
data class RefreshRequest(
    @Json(name = "refresh_token") val refreshToken: String,
)

@JsonClass(generateAdapter = true)
data class TokenResponse(
    @Json(name = "access_token") val accessToken: String,
    @Json(name = "refresh_token") val refreshToken: String,
    @Json(name = "token_type") val tokenType: String = "bearer",
)

@JsonClass(generateAdapter = true)
data class UserDto(
    val id: String,
    val nom: String,
    val email: String,
    @Json(name = "type_profil") val typeProfil: TypeProfil,
    @Json(name = "is_admin") val isAdmin: Boolean = false,
)
