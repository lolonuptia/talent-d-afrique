package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.toUserMessage

import com.talentdafrique.app.data.remote.api.UsersApi
import com.talentdafrique.app.data.remote.dto.UserDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsersRepository @Inject constructor(
    private val usersApi: UsersApi,
) {
    suspend fun updateMe(nom: String, email: String): Result<UserDto> = try {
        Result.Success(usersApi.updateMe(mapOf("nom" to nom, "email" to email)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Modification impossible."))
    }

    suspend fun exportMyData(): Result<String> = try {
        val json = withContext(Dispatchers.IO) { usersApi.exportMyData().use { it.string() } }
        Result.Success(json)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Export impossible."))
    }

    suspend fun deleteMyAccount(): Result<Unit> = try {
        usersApi.deleteMyAccount()
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Suppression impossible."))
    }
}