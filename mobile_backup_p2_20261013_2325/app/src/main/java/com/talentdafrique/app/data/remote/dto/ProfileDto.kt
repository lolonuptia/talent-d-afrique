package com.talentdafrique.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

sealed interface ProfileDto {

    @JsonClass(generateAdapter = true)
    data class Etudiant(
        val id: String,
        @Json(name = "user_id") val userId: String? = null,
        @Json(name = "ecole_id") val ecoleId: String? = null,
        @Json(name = "cv_url") val cvUrl: String? = null,
        val competences: String? = null,
        val experiences: String? = null,
        val formations: String? = null,
        val disponibilite: String? = null,
        val preferences: String? = null,
    ) : ProfileDto

    @JsonClass(generateAdapter = true)
    data class Entreprise(
        val id: String,
        @Json(name = "user_id") val userId: String? = null,
        val secteur: String? = null,
        val taille: String? = null,
        val culture: String? = null,
        val description: String? = null,
        val localisation: String? = null,
        @Json(name = "logo_url") val logoUrl: String? = null,
    ) : ProfileDto

    @JsonClass(generateAdapter = true)
    data class Ecole(
        val id: String,
        @Json(name = "user_id") val userId: String? = null,
        @Json(name = "nom_etablissement") val nomEtablissement: String? = null,
        val description: String? = null,
        val localisation: String? = null,
    ) : ProfileDto

    @JsonClass(generateAdapter = true)
    data class Freelance(
        val id: String,
        @Json(name = "user_id") val userId: String? = null,
        val competences: String? = null,
        val tjm: Double? = null,
        val disponibilite: String? = null,
        @Json(name = "portfolio_url") val portfolioUrl: String? = null,
        @Json(name = "annees_experience") val anneesExperience: Int? = null,
    ) : ProfileDto
}

@JsonClass(generateAdapter = true)
data class StatsEcoleDto(
    @Json(name = "nb_etudiants") val nbEtudiants: Int,
    @Json(name = "candidatures_envoyees") val candidaturesEnvoyees: Int,
    @Json(name = "candidatures_acceptees") val candidaturesAcceptees: Int,
    @Json(name = "taux_placement") val tauxPlacement: Double,
)