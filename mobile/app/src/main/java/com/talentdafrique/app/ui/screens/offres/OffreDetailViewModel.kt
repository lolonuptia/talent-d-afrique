package com.talentdafrique.app.ui.screens.offres

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.OffreDto
import com.talentdafrique.app.data.repository.CandidaturesRepository
import com.talentdafrique.app.data.repository.FavorisRepository
import com.talentdafrique.app.data.repository.OffresRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OffreDetailUiState(
    val isLoading: Boolean = true,
    val offre: OffreDto? = null,
    val errorMessage: String? = null,
    val isPostulating: Boolean = false,
    val candidatureEnvoyee: Boolean = false,
    val postulerError: String? = null,
    val isFavori: Boolean = false,
)

@HiltViewModel
class OffreDetailViewModel @Inject constructor(
    private val offresRepository: OffresRepository,
    private val candidaturesRepository: CandidaturesRepository,
    private val favorisRepository: FavorisRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val offreId: String = checkNotNull(savedStateHandle["offreId"])

    private val _uiState = MutableStateFlow(OffreDetailUiState())
    val uiState: StateFlow<OffreDetailUiState> = _uiState.asStateFlow()

    init {
        loadOffre()
        loadFavori()
    }

    fun loadOffre() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = offresRepository.getOffreAvecScore(offreId)) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isLoading = false, offre = result.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }

    private fun loadFavori() {
        viewModelScope.launch {
            val r = favorisRepository.list()
            if (r is Result.Success) {
                _uiState.value = _uiState.value.copy(isFavori = r.data.any { it.offreId == offreId })
            }
        }
    }

    fun toggleFavori() {
        viewModelScope.launch {
            val actuel = _uiState.value.isFavori
            val r = if (actuel) favorisRepository.remove(offreId) else favorisRepository.add(offreId)
            when (r) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isFavori = !actuel, postulerError = null)
                is Result.Error -> _uiState.value = _uiState.value.copy(postulerError = r.message)
            }
        }
    }

    fun postuler(message: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPostulating = true, postulerError = null)
            when (val result = candidaturesRepository.postuler(offreId, message)) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isPostulating = false, candidatureEnvoyee = true)
                is Result.Error -> _uiState.value = _uiState.value.copy(isPostulating = false, postulerError = result.message)
            }
        }
    }
}