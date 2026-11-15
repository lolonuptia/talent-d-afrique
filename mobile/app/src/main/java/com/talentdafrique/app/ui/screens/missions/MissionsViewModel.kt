package com.talentdafrique.app.ui.screens.missions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.MissionDto
import com.talentdafrique.app.data.repository.MissionsRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MissionsUiState(
    val isLoading: Boolean = true,
    val missions: List<MissionDto> = emptyList(),
    val errorMessage: String? = null,
    val actionError: String? = null,
)

@HiltViewModel
class MissionsViewModel @Inject constructor(
    private val repository: MissionsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MissionsUiState())
    val uiState: StateFlow<MissionsUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    /** Rafraichissement silencieux : pas de spinner. */
    fun refresh() {
        viewModelScope.launch {
            val result = repository.mesMissions()
            if (result is Result.Success) {
                _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = null, missions = result.data)
            }
        }
    }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val result = repository.mesMissions()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isLoading = false, missions = result.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = result.message)
            }
        }
    }

    fun cocherJalon(jalonId: String, fait: Boolean) {
        viewModelScope.launch { appliquer(repository.cocherJalon(jalonId, fait)) }
    }

    fun changerStatut(missionId: String, statut: String) {
        viewModelScope.launch { appliquer(repository.changerStatut(missionId, statut)) }
    }

    fun changerAvancement(missionId: String, avancement: Int) {
        viewModelScope.launch { appliquer(repository.changerAvancement(missionId, avancement)) }
    }

    fun ajouterNote(missionId: String, contenu: String) {
        viewModelScope.launch { appliquer(repository.ajouterNote(missionId, contenu)) }
    }

    fun effacerErreurAction() {
        _uiState.value = _uiState.value.copy(actionError = null)
    }

    private fun appliquer(result: Result<MissionDto>) {
        when (result) {
            is Result.Success -> _uiState.value = _uiState.value.copy(
                actionError = null,
                missions = _uiState.value.missions.map { if (it.id == result.data.id) result.data else it },
            )
            is Result.Error -> _uiState.value = _uiState.value.copy(actionError = result.message)
        }
    }
}