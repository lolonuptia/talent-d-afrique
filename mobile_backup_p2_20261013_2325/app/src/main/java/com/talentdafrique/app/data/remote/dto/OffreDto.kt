package com.talentdafrique.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

enum class TypeContrat {
    @Json(name = "stage") STAGE,
    @Json(name = "cdd") CDD,
    @Json(name = "cdi") CDI,
    @Json(name = "mission") MISSION, // freelance — étape 8
}

enum class StatutOffre {
    @Json(name = "active") ACTIVE,
    @Json(name = "expiree") EXPIREE,
    @Json(name = "archivee") ARCHIVEE,
}

@JsonClass(generateAdapter = true)
data class OffreDto(
    val id: String,
    @Json(name = "entreprise_id") val entrepriseId: String,
    val titre: String,
    val description: String? = null,
    @Json(name = "type_contrat") val typeContrat: TypeContrat,
    @Json(name = "competences_obligatoires") val competencesObligatoires: String? = null,
    @Json(name = "competences_souhaitees") val competencesSouhaitees: String? = null,
    @Json(name = "soft_skills") val softSkills: String? = null,
    @Json(name = "niveau_experience") val niveauExperience: String? = null,
    val disponibilite: String? = null,
    val localisation: String? = null,
    val remuneration: Double? = null,
    @Json(name = "budget_tjm") val budgetTjm: Double? = null, // pertinent si type_contrat = MISSION
    val statut: StatutOffre,
    // Présents uniquement quand l'offre vient de GET /offres/recommandees (OffreAvecScore côté backend) —
    // ce sont des champs plats, pas un sous-objet imbriqué.
    @Json(name = "score_global") val scoreGlobal: Double? = null,
    val recommandee: Boolean? = null,
)

enum class StatutCandidature {
    @Json(name = "recue") RECUE,
    @Json(name = "en_cours") EN_COURS,
    @Json(name = "entretien") ENTRETIEN,
    @Json(name = "refusee") REFUSEE,
    @Json(name = "acceptee") ACCEPTEE,
}

@JsonClass(generateAdapter = true)
data class CandidatureDto(
    val id: String,
    @Json(name = "offre_id") val offreId: String,
    @Json(name = "candidat_id") val candidatId: String,
    val statut: StatutCandidature,
    val message: String?,
    // Présent car CandidatureOut (backend) inclut désormais l'offre imbriquée.
    val offre: OffreDto? = null,
)

@JsonClass(generateAdapter = true)
data class CandidatureCreateRequest(
    @Json(name = "offre_id") val offreId: String,
    val message: String? = null,
)

@JsonClass(generateAdapter = true)
data class StatutUpdateRequest(
    val statut: StatutCandidature,
)

@JsonClass(generateAdapter = true)
data class NotificationDto(
    val id: String,
    val titre: String,
    val message: String? = null,
    @Json(name = "type_evenement") val typeEvenement: String? = null,
    val lue: Boolean,
    @Json(name = "created_at") val createdAt: String,
)