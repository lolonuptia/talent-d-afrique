package com.talentdafrique.app.data.repository

import com.talentdafrique.app.data.remote.toUserMessage

import com.talentdafrique.app.data.remote.api.NotificationsApi
import com.talentdafrique.app.data.remote.dto.NotificationDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationsRepository @Inject constructor(
    private val notificationsApi: NotificationsApi,
) {
    suspend fun listNotifications(): Result<List<NotificationDto>> = try {
        Result.Success(notificationsApi.listNotifications())
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de récupérer les notifications."))
    }

    /** Nombre de notifications non lues (badge de la barre du bas). */
    suspend fun unreadCount(): Int = try {
        notificationsApi.listUnread().size
    } catch (e: Exception) {
        0
    }

    suspend fun markAsRead(id: String): Result<NotificationDto> = try {
        Result.Success(notificationsApi.markAsRead(id))
    } catch (e: Exception) {
        Result.Error(e.toUserMessage("Impossible de marquer la notification comme lue."))
    }
}