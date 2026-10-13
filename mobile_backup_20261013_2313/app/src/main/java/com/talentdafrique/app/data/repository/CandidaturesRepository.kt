package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.api.CandidaturesApi
import com.talentdafrique.app.data.remote.dto.CandidatureCreateRequest
import com.talentdafrique.app.data.remote.dto.CandidatureDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CandidaturesRepository @Inject constructor(
    private val candidaturesApi: CandidaturesApi,
) {
    suspend fun postuler(offreId: String, message: String? = null): Result<CandidatureDto> = try {
        Result.Success(candidaturesApi.postuler(CandidatureCreateRequest(offreId, message)))
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible d'envoyer ta candidature.")
    }

    suspend fun mesCandidatures(): Result<List<CandidatureDto>> = try {
        Result.Success(candidaturesApi.mesCandidatures())
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer tes candidatures.")
    }
}