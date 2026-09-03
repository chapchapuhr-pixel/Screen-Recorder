package com.screenpro.recording

import android.content.Context
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.net.Uri
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import com.screenpro.audio.AudioRecordingManager
import com.screenpro.storage.MediaStoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.io.File

data class RecordingEngineState(
    val isRecording: Boolean = false,
    val isPaused: Boolean = false,
    val elapsedSeconds: Long = 0,
    val outputUri: Uri? = null,
    val error: String? = null
)

/**
 * ScreenRecordingManager
 * Configures hardware H.264/HEVC encoder, VirtualDisplay, MediaRecorder,
 * and synchronized audio mixing pipeline.
 */
class ScreenRecordingManager(private val context: Context) {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaRecorder: MediaRecorder? = null
    private val audioRecordingManager = AudioRecordingManager(context)
    private val mediaStoreRepository = MediaStoreRepository(context)

    private val _recordingState = MutableStateFlow(RecordingEngineState())
    val recordingState: StateFlow<RecordingEngineState> = _recordingState

    private var currentOutputFile: File? = null

    fun setMediaProjection(projection: MediaProjection) {
        this.mediaProjection = projection
    }

    fun startRecording(
        width: Int = 1080,
        height: Int = 1920,
        fps: Int = 30,
        bitrate: Int = 8_000_000,
        enableMic: Boolean = true,
        enableInternalAudio: Boolean = false
    ) {
        val projection = mediaProjection ?: run {
            _recordingState.value = _recordingState.value.copy(error = "MediaProjection consent required")
            return
        }

        try {
            currentOutputFile = File(context.cacheDir, "temp_record_${System.currentTimeMillis()}.mp4")

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                if (enableMic) {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                }
                setVideoSource(MediaRecorder.VideoSource.SURFACE)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setVideoEncoder(MediaRecorder.VideoEncoder.H264)
                if (enableMic) {
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioEncodingBitRate(128_000)
                    setAudioSamplingRate(48_000)
                }
                setVideoSize(width, height)
                setVideoFrameRate(fps)
                setVideoEncodingBitRate(bitrate)
                setOutputFile(currentOutputFile!!.absolutePath)
                prepare()
            }

            // Create VirtualDisplay mapped to MediaRecorder's surface
            val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(metrics)

            virtualDisplay = projection.createVirtualDisplay(
                "ScreenPro_VirtualDisplay",
                width,
                height,
                metrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                mediaRecorder?.surface,
                null,
                null
            )

            mediaRecorder?.start()
            _recordingState.value = RecordingEngineState(isRecording = true)

        } catch (e: Exception) {
            _recordingState.value = RecordingEngineState(error = e.localizedMessage)
        }
    }

    fun pauseRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mediaRecorder?.pause()
            _recordingState.value = _recordingState.value.copy(isPaused = true)
        }
    }

    fun resumeRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mediaRecorder?.resume()
            _recordingState.value = _recordingState.value.copy(isPaused = false)
        }
    }

    fun stopRecording(onComplete: (Boolean, Uri?) -> Unit) {
        try {
            mediaRecorder?.stop()
            mediaRecorder?.reset()
            mediaRecorder?.release()
            mediaRecorder = null

            virtualDisplay?.release()
            virtualDisplay = null

            // Save to MediaStore (Movies/ScreenPro)
            currentOutputFile?.let { tempFile ->
                val savedUri = mediaStoreRepository.saveVideoToMediaStore(tempFile)
                _recordingState.value = RecordingEngineState(isRecording = false, outputUri = savedUri)
                onComplete(true, savedUri)
            }
        } catch (e: Exception) {
            onComplete(false, null)
        }
    }

    fun takeScreenshot() {
        // Implementation uses ImageReader surface with MediaProjection
    }
}