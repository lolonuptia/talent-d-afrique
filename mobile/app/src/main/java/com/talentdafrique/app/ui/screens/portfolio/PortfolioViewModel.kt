package com.talentdafrique.app.ui.screens.portfolio

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.PortfolioCreateRequest
import com.talentdafrique.app.data.remote.dto.PortfolioItemDto
import com.talentdafrique.app.data.repository.PortfolioRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PortfolioUiState(
    val isLoading: Boolean = true,
    val items: List<PortfolioItemDto> = emptyList(),
    val errorMessage: String? = null,
    val formError: String? = null,
    val isSaving: Boolean = false,
)

@HiltViewModel
class PortfolioViewModel @Inject constructor(
    private val repo: PortfolioRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(PortfolioUiState())
    val uiState: StateFlow<PortfolioUiState> = _ui.asStateFlow()

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

    fun add(titre: String, description: String, url: String, onSuccess: () -> Unit) {
        if (titre.isBlank()) {
            _ui.value = _ui.value.copy(formError = "Le titre est obligatoire.")
            return
        }
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isSaving = true, formError = null)
            val body = PortfolioCreateRequest(
                titre = titre.trim(),
                description = description.trim().ifBlank { null },
                url = url.trim().ifBlank { null },
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