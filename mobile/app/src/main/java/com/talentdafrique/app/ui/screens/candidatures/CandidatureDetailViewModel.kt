package com.talentdafrique.app.ui.screens.candidatures

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.CandidatureDto
import com.talentdafrique.app.data.remote.dto.EntretienDto
import com.talentdafrique.app.data.repository.CandidaturesRepository
import com.talentdafrique.app.data.repository.EntretiensRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CandidatureDetailUiState(
    val isLoading: Boolean = true,
    val candidature: CandidatureDto? = null,
    val entretiens: List<EntretienDto> = emptyList(),
    val errorMessage: String? = null,
    val isRetiring: Boolean = false,
    val retiree: Boolean = false,
    val retraitError: String? = null,
)

@HiltViewModel
class CandidatureDetailViewModel @Inject constructor(
    private val candidaturesRepository: CandidaturesRepository,
    private val entretiensRepository: EntretiensRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val candidatureId: String = checkNotNull(savedStateHandle["candidatureId"])

    private val _ui = MutableStateFlow(CandidatureDetailUiState())
    val uiState: StateFlow<CandidatureDetailUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = candidaturesRepository.mesCandidatures()) {
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
                is Result.Success -> {
                    val c = r.data.firstOrNull { it.id == candidatureId }
                    val e = entretiensRepository.list()
                    val entretiens = if (e is Result.Success) e.data.filter { it.candidatureId == candidatureId } else emptyList()
                    _ui.value = _ui.value.copy(
                        isLoading = false,
                        candidature = c,
                        entretiens = entretiens,
                        errorMessage = if (c == null) "Candidature introuvable." else null,
                    )
                }
            }
        }
    }

    fun retirer() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isRetiring = true, retraitError = null)
            when (val r = candidaturesRepository.retirer(candidatureId)) {
                is Result.Success -> _ui.value = _ui.value.copy(isRetiring = false, retiree = true)
                is Result.Error -> _ui.value = _ui.value.copy(isRetiring = false, retraitError = r.message)
            }
        }
    }
}