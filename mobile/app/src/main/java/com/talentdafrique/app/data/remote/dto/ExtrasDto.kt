package com.talentdafrique.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class FavoriCreateRequest(@Json(name = "offre_id") val offreId: String)

@JsonClass(generateAdapter = true)
data class FavoriDto(
    val id: String,
    @Json(name = "offre_id") val offreId: String,
    @Json(name = "created_at") val createdAt: String? = null,
    val offre: OffreDto? = null,
)

@JsonClass(generateAdapter = true)
data class EntretienDto(
    val id: String,
    @Json(name = "candidature_id") val candidatureId: String,
    @Json(name = "date_heure") val dateHeure: String,
    @Json(name = "duree_minutes") val dureeMinutes: Int = 30,
    val mode: String = "visio",
    @Json(name = "lieu_ou_lien") val lieuOuLien: String? = null,
    val message: String? = null,
    val statut: String = "planifie",
)

@JsonClass(generateAdapter = true)
data class MessageCreateRequest(val contenu: String)

@JsonClass(generateAdapter = true)
data class MessageDto(
    val id: String,
    @Json(name = "candidature_id") val candidatureId: String,
    @Json(name = "expediteur_id") val expediteurId: String,
    val contenu: String,
    val lue: Boolean = false,
    @Json(name = "created_at") val createdAt: String? = null,
)

@JsonClass(generateAdapter = true)
data class ConversationDto(
    @Json(name = "candidature_id") val candidatureId: String,
    @Json(name = "offre_titre") val offreTitre: String,
    @Json(name = "interlocuteur_nom") val interlocuteurNom: String,
    @Json(name = "dernier_message") val dernierMessage: String,
    @Json(name = "dernier_message_at") val dernierMessageAt: String? = null,
    @Json(name = "non_lus") val nonLus: Int = 0,
)

@JsonClass(generateAdapter = true)
data class CertificationDto(
    val id: String,
    val intitule: String,
    val organisme: String? = null,
    @Json(name = "date_obtention") val dateObtention: String? = null,
    @Json(name = "url_verification") val urlVerification: String? = null,
)

@JsonClass(generateAdapter = true)
data class CertificationCreateRequest(
    val intitule: String,
    val organisme: String? = null,
    @Json(name = "date_obtention") val dateObtention: String? = null,
    @Json(name = "url_verification") val urlVerification: String? = null,
)

@JsonClass(generateAdapter = true)
data class PortfolioItemDto(
    val id: String,
    val titre: String,
    val description: String? = null,
    val url: String? = null,
    @Json(name = "image_url") val imageUrl: String? = null,
)

@JsonClass(generateAdapter = true)
data class PortfolioCreateRequest(
    val titre: String,
    val description: String? = null,
    val url: String? = null,
)

@JsonClass(generateAdapter = true)
data class EcoleLightDto(
    val id: String,
    @Json(name = "nom_etablissement") val nomEtablissement: String? = null,
    val localisation: String? = null,
)