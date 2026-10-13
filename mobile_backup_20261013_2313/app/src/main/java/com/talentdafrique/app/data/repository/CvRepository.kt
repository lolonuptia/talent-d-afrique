package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.api.CvApi
import com.talentdafrique.app.data.remote.dto.ProfileDto
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CvRepository @Inject constructor(
    private val cvApi: CvApi,
) {
    suspend fun uploadCv(file: File): Result<ProfileDto.Etudiant> = try {
        val requestBody = file.asRequestBody("application/pdf".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, requestBody)
        Result.Success(cvApi.uploadCv(part))
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible d'envoyer ton CV.")
    }
}