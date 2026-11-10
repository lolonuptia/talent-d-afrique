package com.talentdafrique.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/** Miroir de app/schemas/mission.py */
@JsonClass(generateAdapter = true)
data class JalonDto(
    val id: String,
    val titre: String,
    @Json(name = "date_prevue") val datePrevue: String? = null,
    val fait: Boolean,
    val position: Int = 0,
)

@JsonClass(generateAdapter = true)
data class NoteDto(
    val id: String,
    val contenu: String,
    val avancement: Int? = null,
    @Json(name = "created_at") val createdAt: String,
)

@JsonClass(generateAdapter = true)
data class MissionDto(
    val id: String,
    @Json(name = "candidature_id") val candidatureId: String,
    val titre: String,
    val description: String? = null,
    @Json(name = "date_debut") val dateDebut: String? = null,
    @Json(name = "date_fin") val dateFin: String? = null,
    val avancement: Int,
    val statut: String,
    @Json(name = "created_at") val createdAt: String,
    @Json(name = "updated_at") val updatedAt: String? = null,
    @Json(name = "candidat_nom") val candidatNom: String,
    @Json(name = "offre_titre") val offreTitre: String,
    val jalons: List<JalonDto> = emptyList(),
    val notes: List<NoteDto> = emptyList(),
)

@JsonClass(generateAdapter = true)
data class MissionTalentRequest(
    val avancement: Int? = null,
    val statut: String? = null,
)

@JsonClass(generateAdapter = true)
data class JalonTalentRequest(
    val fait: Boolean,
)