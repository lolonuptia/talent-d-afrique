package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.api.OffresApi
import com.talentdafrique.app.data.remote.dto.OffreDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OffresRepository @Inject constructor(
    private val offresApi: OffresApi,
) {
    suspend fun getOffresRecommandees(): Result<List<OffreDto>> = try {
        Result.Success(offresApi.getOffresRecommandees())
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer les offres recommandées.")
    }

    suspend fun listOffres(statut: String? = null, typeContrat: String? = null): Result<List<OffreDto>> = try {
        Result.Success(offresApi.listOffres(statut, typeContrat))
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer les offres.")
    }

    suspend fun getOffre(id: String): Result<OffreDto> = try {
        Result.Success(offresApi.getOffre(id))
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de récupérer cette offre.")
    }
}