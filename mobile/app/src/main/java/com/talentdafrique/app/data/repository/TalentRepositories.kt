package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.api.CertificationsApi
import com.talentdafrique.app.data.remote.api.EntretiensApi
import com.talentdafrique.app.data.remote.api.FavorisApi
import com.talentdafrique.app.data.remote.api.MessagesApi
import com.talentdafrique.app.data.remote.api.PortfolioApi
import com.talentdafrique.app.data.remote.dto.CertificationCreateRequest
import com.talentdafrique.app.data.remote.dto.CertificationDto
import com.talentdafrique.app.data.remote.dto.ConversationDto
import com.talentdafrique.app.data.remote.dto.EntretienDto
import com.talentdafrique.app.data.remote.dto.FavoriCreateRequest
import com.talentdafrique.app.data.remote.dto.FavoriDto
import com.talentdafrique.app.data.remote.dto.MessageCreateRequest
import com.talentdafrique.app.data.remote.dto.MessageDto
import com.talentdafrique.app.data.remote.dto.PortfolioCreateRequest
import com.talentdafrique.app.data.remote.dto.PortfolioItemDto
import com.talentdafrique.app.data.remote.toUserMessage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FavorisRepository @Inject constructor(private val api: FavorisApi) {
    suspend fun list(): Result<List<FavoriDto>> = try {
        Result.Success(api.list())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger tes favoris."))
    }

    suspend fun add(offreId: String): Result<Unit> = try {
        api.add(FavoriCreateRequest(offreId))
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible d'ajouter aux favoris."))
    }

    suspend fun remove(offreId: String): Result<Unit> = try {
        api.remove(offreId)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de retirer des favoris."))
    }
}

@Singleton
class EntretiensRepository @Inject constructor(private val api: EntretiensApi) {
    suspend fun list(): Result<List<EntretienDto>> = try {
        Result.Success(api.list())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger tes entretiens."))
    }
}

@Singleton
class MessagesRepository @Inject constructor(private val api: MessagesApi) {
    suspend fun conversations(): Result<List<ConversationDto>> = try {
        Result.Success(api.conversations())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger tes conversations."))
    }

    suspend fun read(candidatureId: String): Result<List<MessageDto>> = try {
        Result.Success(api.read(candidatureId))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger la conversation."))
    }

    suspend fun send(candidatureId: String, contenu: String): Result<MessageDto> = try {
        Result.Success(api.send(candidatureId, MessageCreateRequest(contenu)))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Message non envoyé."))
    }
}

@Singleton
class CertificationsRepository @Inject constructor(private val api: CertificationsApi) {
    suspend fun list(): Result<List<CertificationDto>> = try {
        Result.Success(api.list())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger tes certifications."))
    }

    suspend fun add(body: CertificationCreateRequest): Result<CertificationDto> = try {
        Result.Success(api.add(body))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible d'ajouter la certification."))
    }

    suspend fun delete(id: String): Result<Unit> = try {
        api.delete(id)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Suppression impossible."))
    }
}

@Singleton
class PortfolioRepository @Inject constructor(private val api: PortfolioApi) {
    suspend fun list(): Result<List<PortfolioItemDto>> = try {
        Result.Success(api.list())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de charger ton portfolio."))
    }

    suspend fun add(body: PortfolioCreateRequest): Result<PortfolioItemDto> = try {
        Result.Success(api.add(body))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible d'ajouter le projet."))
    }

    suspend fun delete(id: String): Result<Unit> = try {
        api.delete(id)
        Result.Success(Unit)
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Suppression impossible."))
    }
}