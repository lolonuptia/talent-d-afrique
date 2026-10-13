package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.UserDto
import okhttp3.ResponseBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH

/** Miroir de app/routers/users.py — droits RGPD (rectification, export, oubli). */
interface UsersApi {

    @PATCH("users/me")
    suspend fun updateMe(@Body body: Map<String, @JvmSuppressWildcards Any?>): UserDto

    @GET("users/me/export")
    suspend fun exportMyData(): ResponseBody

    @DELETE("users/me")
    suspend fun deleteMyAccount()
}
