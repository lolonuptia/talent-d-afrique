package com.talentdafrique.app.ui.screens.candidatures

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.CandidatureDto
import com.talentdafrique.app.data.repository.CandidaturesRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CandidaturesUiState(
    val isLoading: Boolean = true,
    val candidatures: List<CandidatureDto> = emptyList(),
    val errorMessage: String? = null,
)

@HiltViewModel
class CandidaturesViewModel @Inject constructor(
    private val candidaturesRepository: CandidaturesRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CandidaturesUiState())
    val uiState: StateFlow<CandidaturesUiState> = _uiState.asStateFlow()

    init {
        loadCandidatures()
    }

    fun loadCandidatures() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = candidaturesRepository.mesCandidatures()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isLoading = false, candidatures = result.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }
}