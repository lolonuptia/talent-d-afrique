package com.talentdafrique.app.ui.screens.ecole

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.EcoleLightDto
import com.talentdafrique.app.data.remote.dto.ProfileDto
import com.talentdafrique.app.data.remote.dto.TypeProfil
import com.talentdafrique.app.data.repository.ProfilesRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EcoleUiState(
    val isLoading: Boolean = true,
    val ecoles: List<EcoleLightDto> = emptyList(),
    val currentEcoleId: String? = null,
    val errorMessage: String? = null,
    val actionError: String? = null,
    val joiningId: String? = null,
)

@HiltViewModel
class EcoleViewModel @Inject constructor(
    private val profilesRepository: ProfilesRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(EcoleUiState())
    val uiState: StateFlow<EcoleUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null, actionError = null)
            val ecoles = profilesRepository.listEcoles()
            val profile = profilesRepository.getMyProfile(TypeProfil.ETUDIANT)
            val currentId = if (profile is Result.Success) (profile.data as? ProfileDto.Etudiant)?.ecoleId else null
            when (ecoles) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, ecoles = ecoles.data, currentEcoleId = currentId)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = ecoles.message)
            }
        }
    }

    fun rejoindre(ecoleId: String) {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(joiningId = ecoleId, actionError = null)
            when (val r = profilesRepository.rattacherEcole(ecoleId)) {
                is Result.Success -> _ui.value = _ui.value.copy(joiningId = null, currentEcoleId = ecoleId)
                is Result.Error -> _ui.value = _ui.value.copy(joiningId = null, actionError = r.message)
            }
        }
    }
}