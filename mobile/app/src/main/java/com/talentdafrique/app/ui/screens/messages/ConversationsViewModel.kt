package com.talentdafrique.app.ui.screens.messages

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.ConversationDto
import com.talentdafrique.app.data.repository.MessagesRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConversationsUiState(
    val isLoading: Boolean = true,
    val conversations: List<ConversationDto> = emptyList(),
    val errorMessage: String? = null,
)

@HiltViewModel
class ConversationsViewModel @Inject constructor(
    private val repo: MessagesRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(ConversationsUiState())
    val uiState: StateFlow<ConversationsUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = repo.conversations()) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, conversations = r.data)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }
}