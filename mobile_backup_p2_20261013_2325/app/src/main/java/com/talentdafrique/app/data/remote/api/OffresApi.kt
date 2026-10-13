package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.OffreDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface OffresApi {

    @GET("offres")
    suspend fun listOffres(
        @Query("statut") statut: String? = null,
        @Query("type_contrat") typeContrat: String? = null,
    ): List<OffreDto>

    /** Offres triées par score de matching pour le candidat connecté. */
    @GET("offres/recommandees")
    suspend fun getOffresRecommandees(): List<OffreDto>

    @GET("offres/{id}")
    suspend fun getOffre(@Path("id") id: String): OffreDto

    @GET("offres/mine")
    suspend fun getMyOffres(): List<OffreDto>

    @POST("offres")
    suspend fun createOffre(@Body body: OffreDto): OffreDto

    @PATCH("offres/{id}")
    suspend fun updateOffre(@Path("id") id: String, @Body body: Map<String, @JvmSuppressWildcards Any?>): OffreDto

    @DELETE("offres/{id}")
    suspend fun deleteOffre(@Path("id") id: String)
}