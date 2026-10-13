package com.talentdafrique.app.ui.screens.favoris

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.talentdafrique.app.data.remote.dto.FavoriDto
import com.talentdafrique.app.data.repository.FavorisRepository
import com.talentdafrique.app.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavorisUiState(
    val isLoading: Boolean = true,
    val favoris: List<FavoriDto> = emptyList(),
    val errorMessage: String? = null,
)

@HiltViewModel
class FavorisViewModel @Inject constructor(
    private val repo: FavorisRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(FavorisUiState())
    val uiState: StateFlow<FavorisUiState> = _ui.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _ui.value = _ui.value.copy(isLoading = true, errorMessage = null)
            when (val r = repo.list()) {
                is Result.Success -> _ui.value = _ui.value.copy(isLoading = false, favoris = r.data)
                is Result.Error -> _ui.value = _ui.value.copy(isLoading = false, errorMessage = r.message)
            }
        }
    }

    fun retirer(offreId: String) {
        viewModelScope.launch {
            when (repo.remove(offreId)) {
                is Result.Success -> _ui.value = _ui.value.copy(favoris = _ui.value.favoris.filter { it.offreId != offreId })
                is Result.Error -> Unit
            }
        }
    }
}