package com.talentdafrique.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.ProfileDto
import com.talentdafrique.app.data.remote.dto.UserDto
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.CvRepository
import com.talentdafrique.app.data.repository.ProfilesRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

/** Doit rester synchronisé avec DisponibiliteCandidat côté backend (app/schemas/profiles.py). */
enum class DisponibiliteOption(val value: String, val label: String) {
    IMMEDIATE("immediate", "Immédiate"),
    UN_MOIS("1_mois", "Sous 1 mois"),
    TROIS_MOIS("3_mois", "Sous 3 mois"),
    SIX_MOIS("6_mois", "Sous 6 mois"),
}

data class ProfileUiState(
    val isLoading: Boolean = true,
    val user: UserDto? = null,
    val profile: ProfileDto? = null,
    val errorMessage: String? = null,
    val isUploadingCv: Boolean = false,
    val cvUploadError: String? = null,
    // Édition du profil
    val isEditing: Boolean = false,
    val editCompetences: String = "",
    val editDisponibilite: DisponibiliteOption? = null,
    val isSaving: Boolean = false,
    val saveError: String? = null,
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profilesRepository: ProfilesRepository,
    private val cvRepository: CvRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            when (val userResult = authRepository.me()) {
                is Result.Error -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = userResult.message)
                    return@launch
                }
                is Result.Success -> {
                    val user = userResult.data
                    when (val profileResult = profilesRepository.getMyProfile(user.typeProfil)) {
                        is Result.Success -> {
                            val etudiant = profileResult.data as? ProfileDto.Etudiant
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                user = user,
                                profile = profileResult.data,
                                editCompetences = etudiant?.competences ?: "",
                                editDisponibilite = DisponibiliteOption.entries.find { it.value == etudiant?.disponibilite },
                            )
                        }
                        is Result.Error -> _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            user = user,
                            errorMessage = profileResult.message,
                        )
                    }
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun uploadCv(file: File) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUploadingCv = true, cvUploadError = null)
            when (val result = cvRepository.uploadCv(file)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(isUploadingCv = false)
                    loadProfile()
                }
                is Result.Error -> _uiState.value = _uiState.value.copy(isUploadingCv = false, cvUploadError = result.message)
            }
        }
    }

    fun startEditing() {
        val etudiant = _uiState.value.profile as? ProfileDto.Etudiant
        _uiState.value = _uiState.value.copy(
            isEditing = true,
            editCompetences = etudiant?.competences ?: "",
            editDisponibilite = DisponibiliteOption.entries.find { it.value == etudiant?.disponibilite },
            saveError = null,
        )
    }

    fun cancelEditing() {
        _uiState.value = _uiState.value.copy(isEditing = false, saveError = null)
    }

    fun onEditCompetencesChange(value: String) {
        _uiState.value = _uiState.value.copy(editCompetences = value)
    }

    fun onEditDisponibiliteSelected(option: DisponibiliteOption) {
        // Re-tap sur l'option déjà sélectionnée = désélectionner (revenir à "non renseigné")
        val newValue = if (_uiState.value.editDisponibilite == option) null else option
        _uiState.value = _uiState.value.copy(editDisponibilite = newValue)
    }

    fun saveProfile() {
        val state = _uiState.value
        viewModelScope.launch {
            _uiState.value = state.copy(isSaving = true, saveError = null)
            val fields = mapOf(
                "competences" to state.editCompetences.ifBlank { null },
                "disponibilite" to state.editDisponibilite?.value,
            )
            when (val result = profilesRepository.updateMyProfile(fields)) {
                is Result.Success -> {
                    _uiState.value = _uiState.value.copy(isSaving = false, isEditing = false)
                    loadProfile()
                }
                is Result.Error -> _uiState.value = _uiState.value.copy(isSaving = false, saveError = result.message)
            }
        }
    }
}