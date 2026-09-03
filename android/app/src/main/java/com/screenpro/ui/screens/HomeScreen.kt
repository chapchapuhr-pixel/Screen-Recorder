package com.screenpro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    isRecording: Boolean,
    onStartRecordingClick: () -> Unit,
    onStopRecordingClick: () -> Unit,
    onNavigateSettings: () -> Unit,
    onNavigateLibrary: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ScreenPro", style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = onNavigateSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            // Primary Prominent Recording Trigger
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                shape = MaterialTheme.shapes.extraLarge
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (isRecording) "Recording Active" else "Ready to Record",
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        text = "1080p • 60 FPS • Mic + Audio",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = if (isRecording) onStopRecordingClick else onStartRecordingClick,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isRecording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = MaterialTheme.shapes.large
                    ) {
                        Icon(
                            imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                            contentDescription = null
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isRecording) "Stop Recording" else "Start Recording",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Quick Actions Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                AssistChip(
                    onClick = onNavigateLibrary,
                    label = { Text("Recordings") },
                    leadingIcon = { Icon(Icons.Default.VideoLibrary, null) }
                )
                AssistChip(
                    onClick = { /* Screenshot */ },
                    label = { Text("Screenshot") },
                    leadingIcon = { Icon(Icons.Default.CameraAlt, null) }
                )
                AssistChip(
                    onClick = onNavigateSettings,
                    label = { Text("Config") },
                    leadingIcon = { Icon(Icons.Default.Tune, null) }
                )
            }
        }
    }
}