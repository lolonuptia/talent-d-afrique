package com.talentdafrique.app

import com.talentdafrique.app.ui.theme.TalentDAfriqueTheme
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.talentdafrique.app.data.repository.AuthRepository
import com.talentdafrique.app.ui.navigation.Routes
import com.talentdafrique.app.ui.navigation.TalentDAfriqueNavGraph
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import androidx.lifecycle.viewModelScope
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TalentDAfriqueTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    TalentDAfriqueRoot()
                }
            }
        }
    }
}

/**
 * État initial : le temps de lire le DataStore (isLoggedIn), on affiche un
 * simple spinner. Une fois résolu, on lance le NavGraph avec le bon point
 * de départ. Le mobile étant réservé aux étudiants, plus besoin de récupérer
 * le type de profil — un seul HomeScreen possible.
 */
@Composable
fun TalentDAfriqueRoot(viewModel: SessionViewModel = viewModel()) {
    val state by viewModel.state.collectAsState()

    when (val current = state) {
        is SessionState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is SessionState.Resolved -> {
            TalentDAfriqueNavGraph(
                startDestination = if (current.isLoggedIn) Routes.HOME else Routes.LOGIN,
            )
        }
    }
}

sealed interface SessionState {
    data object Loading : SessionState
    data class Resolved(val isLoggedIn: Boolean) : SessionState
}

@HiltViewModel
class SessionViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<SessionState>(SessionState.Loading)
    val state: StateFlow<SessionState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.isLoggedIn.collect { loggedIn ->
                _state.value = SessionState.Resolved(isLoggedIn = loggedIn)
            }
        }
    }
}