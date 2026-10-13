package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.toUserMessage

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
        Result.Error(e.toUserMessage("Impossible d'envoyer ta candidature."))
    }

    suspend fun retirer(id: String): Result<Unit> = try {
        candidaturesApi.retirer(id)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de retirer ta candidature."))
    }

    suspend fun mesCandidatures(): Result<List<CandidatureDto>> = try {
        Result.Success(candidaturesApi.mesCandidatures())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer tes candidatures."))
    }
}