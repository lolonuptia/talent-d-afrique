package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.remote.dto.ProfileDto
import com.talentdafrique.app.data.remote.dto.StatsEcoleDto
import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path

interface ProfilesApi {

    @GET("profiles/me")
    suspend fun getMyProfileRaw(): Map<String, @JvmSuppressWildcards Any?>

    @PUT("profiles/me")
    suspend fun updateMyProfile(@Body body: Map<String, @JvmSuppressWildcards Any?>): Map<String, @JvmSuppressWildcards Any?>

    @PUT("profiles/ecole/rattacher/{etudiantId}")
    suspend fun rattacherEtudiant(@Path("etudiantId") etudiantId: String)

    @GET("profiles/ecole/etudiants")
    suspend fun listEtudiants(): List<ProfileDto.Etudiant>

    @GET("profiles/ecole/suggestions/{etudiantId}")
    suspend fun suggestionsPourEtudiant(@Path("etudiantId") etudiantId: String): List<OffreDto>

    @GET("profiles/ecole/stats")
    suspend fun statsEmployabilite(): StatsEcoleDto
}

/** Miroir de app/routers/cv.py — upload et parsing automatique de CV. */
interface CvApi {
    @Multipart
    @POST("profiles/etudiant/cv")
    suspend fun uploadCv(@Part file: MultipartBody.Part): ProfileDto.Etudiant
}