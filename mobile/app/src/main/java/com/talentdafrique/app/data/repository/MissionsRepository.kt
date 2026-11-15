package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.api.MissionsApi
import com.talentdafrique.app.data.remote.dto.JalonTalentRequest
import com.talentdafrique.app.data.remote.dto.MissionDto
import com.talentdafrique.app.data.remote.dto.MissionTalentRequest
import com.talentdafrique.app.data.remote.dto.NoteTalentRequest
import com.talentdafrique.app.data.remote.toUserMessage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MissionsRepository @Inject constructor(
    private val missionsApi: MissionsApi,
) {
    suspend fun mesMissions(): Result<List<MissionDto>> = try {
        Result.Success(missionsApi.mesMissions())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer tes missions."))
    }

    suspend fun changerStatut(id: String, statut: String): Result<MissionDto> = try {
        Result.Success(missionsApi.modifier(id, MissionTalentRequest(statut = statut)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de modifier la mission."))
    }

    suspend fun changerAvancement(id: String, avancement: Int): Result<MissionDto> = try {
        Result.Success(missionsApi.modifier(id, MissionTalentRequest(avancement = avancement)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible d'enregistrer l'avancement."))
    }

    suspend fun ajouterNote(missionId: String, contenu: String): Result<MissionDto> = try {
        Result.Success(missionsApi.ajouterNote(missionId, NoteTalentRequest(contenu)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible d'envoyer le point d'avancement."))
    }

    suspend fun cocherJalon(jalonId: String, fait: Boolean): Result<MissionDto> = try {
        Result.Success(missionsApi.cocherJalon(jalonId, JalonTalentRequest(fait)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de modifier le jalon."))
    }
}