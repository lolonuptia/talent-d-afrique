package com.talentdafrique.app.ui.screens.certifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.CertificationCreateRequest
import com.talentdafrique.app.data.remote.dto.CertificationDto
import com.talentdafrique.app.data.repository.CertificationsRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CertificationsUiState(
    val isLoading: Boolean = true,
    val items: List<CertificationDto> = emptyList(),
    val errorMessage: String? = null,
    val formError: String? = null,
    val isSaving: Boolean = false,
)

@HiltViewModel
class CertificationsViewModel @Inject constructor(
    private val repo: CertificationsRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(CertificationsUiState())
    val uiState: StateFlow<CertificationsUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = repo.list()) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, items = r.data)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }

    fun clearFormError() { _ui.value = _ui.value.copy(formError = null) }

    fun add(intitule: String, organisme: String, date: String, url: String, onSuccess: () -> Unit) {
        if (intitule.isBlank()) {
            _ui.value = _ui.value.copy(formError = "L'intitulé est obligatoire.")
            return
        }
        if (date.isNotBlank() && !Regex("""\d{4}-\d{2}-\d{2}""").matches(date.trim())) {
            _ui.value = _ui.value.copy(formError = "Date au format AAAA-MM-JJ (ex : 2024-05-12).")
            return
        }
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isSaving = true, formError = null)
            val body = CertificationCreateRequest(
                intitule = intitule.trim(),
                organisme = organisme.trim().ifBlank { null },
                dateObtention = date.trim().ifBlank { null },
                urlVerification = url.trim().ifBlank { null },
            )
            when (val r = repo.add(body)) {
                is Result.Success -> {
                    _ui.value = _ui.value.copy(isSaving = false, items = listOf(r.data) + _ui.value.items)
                    onSuccess()
                }
                is Result.Error -> _ui.value = _ui.value.copy(isSaving = false, formError = r.message)
            }
        }
    }

    fun delete(id: String) {
        viewModelScope.launch {
            if (repo.delete(id) is Result.Success) {
                _ui.value = _ui.value.copy(items = _ui.value.items.filter { it.id != id })
            }
        }
    }
}