package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.toUserMessage

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
        Result.Error(e.toUserMessage("Impossible de récupérer les offres recommandées."))
    }

    suspend fun listOffres(statut: String? = null, typeContrat: String? = null): Result<List<OffreDto>> = try {
        Result.Success(offresApi.listOffres(statut, typeContrat))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer les offres."))
    }

    /** GET /offres/{id} n'a pas de score : on le récupère via /offres/recommandees. */
    suspend fun getOffreAvecScore(id: String): Result<OffreDto> = try {
        val base = offresApi.getOffre(id)
        val scored = try {
            offresApi.getOffresRecommandees().firstOrNull { it.id == id }
        } catch (e: Exception) {
            null
        }
        Result.Success(scored ?: base)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer cette offre."))
    }

    suspend fun getOffre(id: String): Result<OffreDto> = try {
        Result.Success(offresApi.getOffre(id))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer cette offre."))
    }
}