package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.CandidatureCreateRequest
import com.talentdafrique.app.data.remote.dto.CandidatureDto
import com.talentdafrique.app.data.remote.dto.StatutUpdateRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** Miroir de app/routers/candidatures.py */
interface CandidaturesApi {

    @POST("candidatures")
    suspend fun postuler(@Body body: CandidatureCreateRequest): CandidatureDto

    /** Mes propres candidatures (côté candidat). */
    @GET("candidatures/mine")
    suspend fun mesCandidatures(): List<CandidatureDto>

    /** Candidatures reçues sur une offre (côté entreprise), avec filtres du dashboard. */
    @GET("candidatures/offre/{offreId}")
    suspend fun candidaturesRecues(
        @Path("offreId") offreId: String,
        @Query("score_min") scoreMin: Int? = null,
        @Query("disponibilite") disponibilite: String? = null,
        @Query("statut") statut: String? = null,
    ): List<CandidatureDto>

    @PATCH("candidatures/{id}/statut")
    suspend fun changerStatut(@Path("id") id: String, @Body body: StatutUpdateRequest): CandidatureDto
}
