package com.talentdafrique.app.ui.screens.entretiens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.EntretienDto
import com.talentdafrique.app.data.repository.EntretiensRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EntretiensUiState(
    val isLoading: Boolean = true,
    val entretiens: List<EntretienDto> = emptyList(),
    val errorMessage: String? = null,
)

@HiltViewModel
class EntretiensViewModel @Inject constructor(
    private val repo: EntretiensRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(EntretiensUiState())
    val uiState: StateFlow<EntretiensUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = repo.list()) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, entretiens = r.data)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }
}