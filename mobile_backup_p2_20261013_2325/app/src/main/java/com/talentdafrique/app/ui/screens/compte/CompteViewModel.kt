package com.talentdafrique.app.ui.screens.compte

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.UserDto
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.data.repository.Result
import com.talentdafrique.app.data.repository.UsersRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CompteUiState(
    val isLoading: Boolean = true,
    val user: UserDto? = null,
    val errorMessage: String? = null,
    val editNom: String = "",
    val editEmail: String = "",
    val isSaving: Boolean = false,
    val saveMessage: String? = null,
    val saveError: String? = null,
    val isExporting: Boolean = false,
    val exportedJson: String? = null,
    val exportError: String? = null,
    val isDeleting: Boolean = false,
    val deleteError: String? = null,
)

@HiltViewModel
class CompteViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val usersRepository: UsersRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CompteUiState())
    val uiState: StateFlow<CompteUiState> = _uiState.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            when (val r = authRepository.me()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(
                    isLoading = false, user = r.data, editNom = r.data.nom, editEmail = r.data.email,
                )
                is Result.Error -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }

    fun onNomChange(v: String) { _uiState.value = _uiState.value.copy(editNom = v, saveMessage = null) }
    fun onEmailChange(v: String) { _uiState.value = _uiState.value.copy(editEmail = v, saveMessage = null) }

    fun save() {
        val s = _uiState.value
        if (s.editNom.isBlank() || s.editEmail.isBlank()) {
            _uiState.value = s.copy(saveError = "Le nom et l'email sont obligatoires.")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, saveError = null, saveMessage = null)
            when (val r = usersRepository.updateMe(s.editNom.trim(), s.editEmail.trim())) {
                is Result.Success -> _uiState.value = _uiState.value.copy(
                    isSaving = false, user = r.data, saveMessage = "Informations mises à jour ✓",
                )
                is Result.Error -> _uiState.value = _uiState.value.copy(isSaving = false, saveError = r.message)
            }
        }
    }

    fun export() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isExporting = true, exportError = null)
            when (val r = usersRepository.exportMyData()) {
                is Result.Success -> _uiState.value = _uiState.value.copy(isExporting = false, exportedJson = r.data)
                is Result.Error -> _uiState.value = _uiState.value.copy(isExporting = false, exportError = r.message)
            }
        }
    }

    fun exportConsumed() { _uiState.value = _uiState.value.copy(exportedJson = null) }

    fun deleteAccount() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDeleting = true, deleteError = null)
            when (val r = usersRepository.deleteMyAccount()) {
                is Result.Success -> authRepository.logout()
                is Result.Error -> _uiState.value = _uiState.value.copy(isDeleting = false, deleteError = r.message)
            }
        }
    }
}