package com.talentdafrique.app.data.remote.api

import com.talentdafrique.app.data.remote.dto.NotificationDto
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

/**
 * Miroir de la nouvelle étape 9 (notifications). En l'absence de push (FCM),
 * l'app fait du polling : on rappelle listNotifications() périodiquement
 * (ex: au retour au premier plan de l'app, ou toutes les X minutes via
 * WorkManager) pour rafraîchir le badge de compteur non-lues.
 */
interface NotificationsApi {

    @GET("notifications")
    suspend fun listNotifications(): List<NotificationDto>

    @GET("notifications/unread-count")
    suspend fun unreadCount(): Map<String, Int> // ex: {"count": 3}

    @PATCH("notifications/{id}/lue")
    suspend fun markAsRead(@Path("id") id: String): NotificationDto
}
