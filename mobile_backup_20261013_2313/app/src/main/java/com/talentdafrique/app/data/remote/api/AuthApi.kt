package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.LoginRequest
import com.talentdafrique.app.data.remote.dto.RefreshRequest
import com.talentdafrique.app.data.remote.dto.RegisterRequest
import com.talentdafrique.app.data.remote.dto.TokenResponse
import com.talentdafrique.app.data.remote.dto.UserDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Miroir de app/routers/auth.py */
interface AuthApi {

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): TokenResponse

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): TokenResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): TokenResponse

    @GET("auth/me")
    suspend fun me(): UserDto
}
