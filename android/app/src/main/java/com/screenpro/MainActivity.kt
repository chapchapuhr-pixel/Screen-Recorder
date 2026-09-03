package com.screenpro

import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.screenpro.service.ScreenRecordService
import com.screenpro.ui.screens.HomeScreen

class MainActivity : ComponentActivity() {

    private var isRecording by mutableStateOf(false)

    private val projectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            val intent = Intent(this, ScreenRecordService::class.java).apply {
                action = ScreenRecordService.ACTION_START
                putExtra("PROJECTION_INTENT", result.data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
            isRecording = true
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HomeScreen(
                        isRecording = isRecording,
                        onStartRecordingClick = {
                            val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                            projectionLauncher.launch(manager.createScreenCaptureIntent())
                        },
                        onStopRecordingClick = {
                            val intent = Intent(this, ScreenRecordService::class.java).apply {
                                action = ScreenRecordService.ACTION_STOP
                            }
                            startService(intent)
                            isRecording = false
                        },
                        onNavigateSettings = {},
                        onNavigateLibrary = {}
                    )
                }
            }
        }
    }
}
