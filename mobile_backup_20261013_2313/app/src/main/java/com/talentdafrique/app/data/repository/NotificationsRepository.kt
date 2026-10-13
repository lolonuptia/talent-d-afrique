package com.talentdafrique.app.data.repository

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
        Result.Error(e.message ?: "Impossible de récupérer les notifications.")
    }

    suspend fun markAsRead(id: String): Result<NotificationDto> = try {
        Result.Success(notificationsApi.markAsRead(id))
    } catch (e: Exception) {
        Result.Error(e.message ?: "Impossible de marquer la notification comme lue.")
    }
}