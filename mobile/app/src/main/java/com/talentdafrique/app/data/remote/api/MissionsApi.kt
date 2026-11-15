package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.JalonTalentRequest
import com.talentdafrique.app.data.remote.dto.MissionDto
import com.talentdafrique.app.data.remote.dto.MissionTalentRequest
import com.talentdafrique.app.data.remote.dto.NoteTalentRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/** Miroir de app/routers/missions.py (routes talent) */
interface MissionsApi {

    @GET("missions/mine")
    suspend fun mesMissions(): List<MissionDto>

    @PATCH("missions/{id}/talent")
    suspend fun modifier(@Path("id") id: String, @Body body: MissionTalentRequest): MissionDto

    @POST("missions/{id}/notes/talent")
    suspend fun ajouterNote(@Path("id") id: String, @Body body: NoteTalentRequest): MissionDto

    @PATCH("missions/jalons/{id}/talent")
    suspend fun cocherJalon(@Path("id") id: String, @Body body: JalonTalentRequest): MissionDto
}