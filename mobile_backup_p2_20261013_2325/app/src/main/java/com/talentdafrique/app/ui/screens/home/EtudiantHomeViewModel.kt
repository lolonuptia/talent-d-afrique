package com.talentdafrique.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.repository.OffresRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EtudiantHomeUiState(
    val isLoading: Boolean = true,
    val offres: List<OffreDto> = emptyList(),
    val errorMessage: String? = null,
)

@HiltViewModel
class EtudiantHomeViewModel @Inject constructor(
    private val offresRepository: OffresRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(EtudiantHomeUiState())
    val uiState: StateFlow<EtudiantHomeUiState> = _uiState.asStateFlow()

    init {
        loadOffresRecommandees()
    }

    fun loadOffresRecommandees() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = offresRepository.getOffresRecommandees()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isLoading = false, offres = result.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }
}