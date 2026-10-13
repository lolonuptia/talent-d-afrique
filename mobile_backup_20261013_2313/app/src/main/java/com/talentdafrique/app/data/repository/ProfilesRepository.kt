package com.talentdafrique.app.data.repository

import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.talentdafrique.app.data.remote.api.ProfilesApi
import com.talentdafrique.app.data.remote.dto.ProfileDto
import com.talentdafrique.app.data.remote.dto.TypeProfil
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Le backend renvoie un JSON qui varie selon le type de profil connecté.
 * Retrofit ne peut pas typer dynamiquement le retour, donc on récupère un
 * Map brut puis on le redésérialise vers le bon sous-type de ProfileDto.
 */
@Singleton
class ProfilesRepository @Inject constructor(
    private val profilesApi: ProfilesApi,
    private val moshi: Moshi,
) {
    suspend fun getMyProfile(typeProfil: TypeProfil): Result<ProfileDto> = try {
        val raw = profilesApi.getMyProfileRaw()
        val mapAdapter = moshi.adapter<Map<String, Any?>>(
            Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java),
        )
        val json = mapAdapter.toJson(raw)

        val profile: ProfileDto? = when (typeProfil) {
            TypeProfil.ETUDIANT -> moshi.adapter(ProfileDto.Etudiant::class.java).fromJson(json)
            TypeProfil.ENTREPRISE -> moshi.adapter(ProfileDto.Entreprise::class.java).fromJson(json)
            TypeProfil.ECOLE -> moshi.adapter(ProfileDto.Ecole::class.java).fromJson(json)
            TypeProfil.FREELANCE -> moshi.adapter(ProfileDto.Freelance::class.java).fromJson(json)
        }

        profile?.let { Result.Success(it) } ?: Result.Error("Profil introuvable.")
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer ton profil.")
    }

    suspend fun updateMyProfile(fields: Map<String, Any?>): Result<Unit> = try {
        profilesApi.updateMyProfile(fields)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de mettre à jour ton profil.")
    }
}