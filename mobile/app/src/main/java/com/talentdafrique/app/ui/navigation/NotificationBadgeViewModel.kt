package com.talentdafrique.app.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.repository.NotificationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Compteur de notifications non lues, rafraîchi toutes les 60 s et à chaque changement d'onglet. */
@HiltViewModel
class NotificationBadgeViewModel @Inject constructor(
    private val repo: NotificationsRepository,
) : ViewModel() {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    init {
        viewModelScope.launch {
            while (true) {
                _count.value = repo.unreadCount()
                delay(60_000)
            }
        }
    }

    fun refreshNow() {
        viewModelScope.launch { _count.value = repo.unreadCount() }
    }
}