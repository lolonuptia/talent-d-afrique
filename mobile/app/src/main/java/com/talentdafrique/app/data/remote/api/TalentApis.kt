package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.CertificationCreateRequest
import com.talentdafrique.app.data.remote.dto.CertificationDto
import com.talentdafrique.app.data.remote.dto.ConversationDto
import com.talentdafrique.app.data.remote.dto.EntretienDto
import com.talentdafrique.app.data.remote.dto.FavoriCreateRequest
import com.talentdafrique.app.data.remote.dto.FavoriDto
import com.talentdafrique.app.data.remote.dto.MessageCreateRequest
import com.talentdafrique.app.data.remote.dto.MessageDto
import com.talentdafrique.app.data.remote.dto.PortfolioCreateRequest
import com.talentdafrique.app.data.remote.dto.PortfolioItemDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface FavorisApi {
    @GET("favoris") suspend fun list(): List<FavoriDto>
    @POST("favoris") suspend fun add(@Body body: FavoriCreateRequest): FavoriDto
    @DELETE("favoris/{offreId}") suspend fun remove(@Path("offreId") offreId: String)
}

interface EntretiensApi {
    @GET("entretiens") suspend fun list(): List<EntretienDto>
}

interface MessagesApi {
    @GET("messages") suspend fun conversations(): List<ConversationDto>
    @GET("messages/{candidatureId}") suspend fun read(@Path("candidatureId") candidatureId: String): List<MessageDto>
    @POST("messages/{candidatureId}")
    suspend fun send(@Path("candidatureId") candidatureId: String, @Body body: MessageCreateRequest): MessageDto
}

interface CertificationsApi {
    @GET("certifications") suspend fun list(): List<CertificationDto>
    @POST("certifications") suspend fun add(@Body body: CertificationCreateRequest): CertificationDto
    @DELETE("certifications/{id}") suspend fun delete(@Path("id") id: String)
}

interface PortfolioApi {
    @GET("portfolio") suspend fun list(): List<PortfolioItemDto>
    @POST("portfolio") suspend fun add(@Body body: PortfolioCreateRequest): PortfolioItemDto
    @DELETE("portfolio/{id}") suspend fun delete(@Path("id") id: String)
}