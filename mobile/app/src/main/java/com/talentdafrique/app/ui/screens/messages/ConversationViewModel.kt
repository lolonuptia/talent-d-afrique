package com.talentdafrique.app.ui.screens.messages

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.MessageDto
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.MessagesRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConversationUiState(
    val isLoading: Boolean = true,
    val messages: List<MessageDto> = emptyList(),
    val meId: String? = null,
    val errorMessage: String? = null,
    val draft: String = "",
    val isSending: Boolean = false,
    val sendError: String? = null,
)

@HiltViewModel
class ConversationViewModel @Inject constructor(
    private val messagesRepository: MessagesRepository,
    private val authRepository: AuthRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val candidatureId: String = checkNotNull(savedStateHandle["candidatureId"])

    private val _ui = MutableStateFlow(ConversationUiState())
    val uiState: StateFlow<ConversationUiState> = _ui.asStateFlow()

    init {
        viewModelScope.launch {
            val me = authRepository.me()
            if (me is Result.Success) _ui.value = _ui.value.copy(meId = me.data.id)
            fetch(initial = true)
            // Pas de push : on rafraîchit la conversation toutes les 10 s tant que l'écran existe.
            while (true) {
                delay(10_000)
                fetch(initial = false)
            }
        }
    }

    fun load() {
        viewModelScope.launch { fetch(initial = true) }
    }

    private suspend fun fetch(initial: Boolean) {
        if (initial) _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
        when (val r = messagesRepository.read(candidatureId)) {
            is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, messages = r.data)
            is Result.Error -> if (initial) _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
        }
    }

    fun onDraftChange(value: String) {
        _ui.value = _ui.value.copy(draft = value, sendError = null)
    }

    fun send() {
        val text = _ui.value.draft.trim()
        if (text.isEmpty() || _ui.value.isSending) return
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isSending = true, sendError = null)
            when (val r = messagesRepository.send(candidatureId, text)) {
                is Result.Success -> {
                    _ui.value = _ui.value.copy(isSending = false, draft = "")
                    fetch(initial = false)
                }
                is Result.Error -> _ui.value = _ui.value.copy(isSending = false, sendError = r.message)
            }
        }
    }
}