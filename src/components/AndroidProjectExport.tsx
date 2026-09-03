import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidSourceFile } from '../data/androidProjectSource';
import {
  FileCode,
  Download,
  Copy,
  Check,
  FolderGit2,
  Terminal,
  Play,
  Github,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import JSZip from 'jszip';

export const AndroidProjectExport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'workflows' | 'source'>('all');
  const [cheatsheetTab, setCheatsheetTab] = useState<'gradle' | 'github'>('github');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = ANDROID_PROJECT_FILES.filter((file) => {
    if (activeCategory === 'workflows') return file.language === 'yaml';
    if (activeCategory === 'source') return file.language !== 'yaml';
    return true;
  });

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files (including .github/workflows/*.yml)
      for (const file of ANDROID_PROJECT_FILES) {
        zip.file(file.path, file.content);
      }

      // Add root settings & build files
      zip.file(
        'android/settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "ScreenPro"
include(":app")
`
      );

      zip.file(
        'android/build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.hilt.android) apply false
}
`
      );

      zip.file(
        'android/gradle/libs.versions.toml',
        `[versions]
agp = "8.8.0"
kotlin = "2.1.0"
composeBom = "2025.02.00"
camera = "1.4.1"
media3 = "1.5.1"
room = "2.6.1"
hilt = "2.51.1"

[libraries]
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version = "1.10.0" }
androidx-lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version = "2.8.7" }

androidx-camera-core = { group = "androidx.camera", name = "camera-core", version.ref = "camera" }
androidx-camera-camera2 = { group = "androidx.camera", name = "camera-camera2", version.ref = "camera" }
androidx-camera-lifecycle = { group = "androidx.camera", name = "camera-lifecycle", version.ref = "camera" }
androidx-camera-view = { group = "androidx.camera", name = "camera-view", version.ref = "camera" }

androidx-media3-exoplayer = { group = "androidx.media3", name = "media3-exoplayer", version.ref = "media3" }
androidx-media3-ui = { group = "androidx.media3", name = "media3-ui", version.ref = "media3" }
androidx-media3-transformer = { group = "androidx.media3", name = "media3-transformer", version.ref = "media3" }

kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version = "1.9.0" }
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

junit = { group = "junit", name = "junit", version = "4.13.2" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version = "1.2.1" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version = "3.6.1" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt-android = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
`
      );

      zip.file(
        'android/gradle/wrapper/gradle-wrapper.properties',
        `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
      );

      zip.file(
        'android/README.md',
        `# ScreenPro — Professional Android Screen Recorder

Complete, production-ready Android screen recorder project built with Kotlin and Jetpack Compose.

## CI/CD Automated APK Builds with GitHub Actions
This project includes pre-configured GitHub Actions workflows in \`.github/workflows/\`:
- \`.github/workflows/build-apk.yml\`: Automatically builds **Debug & Release APKs** on every push, PR, or manual button click via \`workflow_dispatch\`. Outputs downloadable APK artifacts and attaches to tagged releases.
- \`.github/workflows/release-apk.yml\`: Publishes tagged releases with ready-to-install APKs.

### How to Build APK on GitHub:
1. Push this repository to GitHub.
2. Navigate to **Actions** -> **Build Android APK**.
3. Click **Run workflow** -> Choose \`debug\`, \`release\`, or \`both\`.
4. Once completed, download \`ScreenPro-debug-apk\` or \`ScreenPro-release-apk\` from the run artifacts!

## Local Build Commands
\`\`\`bash
# Generate Debug APK
./gradlew assembleDebug

# Generate Release APK
./gradlew assembleRelease

# Generate Release Google Play AAB bundle
./gradlew bundleRelease
\`\`\`
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'ScreenPro-Android-Source.zip';
      link.click();
    } catch (err) {
      console.error('ZIP creation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0A0A0A] text-[#E0E0E0]">
      {/* Left Sidebar: File Tree & Build Commands */}
      <div className="w-full md:w-84 border-r border-[#1E1E1E] bg-[#0E0E0E] flex flex-col">
        {/* Top Header */}
        <div className="p-4 border-b border-[#1E1E1E]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-[#FF4B2B]" />
              <h3 className="font-semibold text-xs text-white">Android Source & CI</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#FF4B2B1F] text-[#FF4B2B] font-mono font-medium">
              SDK 35 • Compose
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white font-semibold text-xs transition-all shadow-lg shadow-[#FF4B2B33] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Generating ZIP...' : 'Download Android Studio ZIP'}</span>
          </button>

          {/* Filter Categories */}
          <div className="flex items-center space-x-1 mt-3 p-1 rounded-xl bg-[#141414] border border-[#222]">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#222] text-white shadow-sm'
                  : 'text-[#888] hover:text-[#CCC]'
              }`}
            >
              All ({ANDROID_PROJECT_FILES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('workflows')}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all ${
                activeCategory === 'workflows'
                  ? 'bg-[#FF4B2B]/20 text-[#FF4B2B] border border-[#FF4B2B]/30'
                  : 'text-[#888] hover:text-[#CCC]'
              }`}
            >
              <Github className="w-3 h-3" />
              <span>CI Workflows</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('source')}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                activeCategory === 'source'
                  ? 'bg-[#222] text-white shadow-sm'
                  : 'text-[#888] hover:text-[#CCC]'
              }`}
            >
              Kotlin/XML
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredFiles.map((file) => {
            const isWorkflow = file.language === 'yaml';
            const isSelected = selectedFile.path === file.path;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start space-x-2.5 ${
                  isSelected
                    ? 'bg-[#FF4B2B15] text-white border border-[#FF4B2B44] font-semibold'
                    : 'hover:bg-[#181818] text-[#888]'
                }`}
              >
                {isWorkflow ? (
                  <Github className="w-4 h-4 mt-0.5 text-[#FF4B2B] shrink-0" />
                ) : (
                  <FileCode className="w-4 h-4 mt-0.5 text-[#FF4B2B] shrink-0" />
                )}
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-[11px] text-[#E0E0E0]">
                      {file.path.split('/').pop()}
                    </span>
                    {isWorkflow && (
                      <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-[#FF4B2B22] text-[#FF4B2B] font-mono shrink-0">
                        APK CI
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-[#666]">{file.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Build Commands & CI Workflow Cheatsheet */}
        <div className="p-3 border-t border-[#1E1E1E] bg-[#0A0A0A] text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-white font-semibold text-xs">
              {cheatsheetTab === 'github' ? (
                <Github className="w-3.5 h-3.5 text-[#FF4B2B]" />
              ) : (
                <Terminal className="w-3.5 h-3.5 text-[#FF4B2B]" />
              )}
              <span>{cheatsheetTab === 'github' ? 'GitHub Actions APK' : 'Local Gradle Build'}</span>
            </div>

            <div className="flex items-center space-x-1 text-[10px]">
              <button
                type="button"
                onClick={() => setCheatsheetTab('github')}
                className={`px-2 py-0.5 rounded ${
                  cheatsheetTab === 'github'
                    ? 'bg-[#FF4B2B22] text-[#FF4B2B] font-semibold'
                    : 'text-[#666] hover:text-[#AAA]'
                }`}
              >
                GitHub CI
              </button>
              <button
                type="button"
                onClick={() => setCheatsheetTab('gradle')}
                className={`px-2 py-0.5 rounded ${
                  cheatsheetTab === 'gradle'
                    ? 'bg-[#222] text-white font-semibold'
                    : 'text-[#666] hover:text-[#AAA]'
                }`}
              >
                CLI
              </button>
            </div>
          </div>

          {cheatsheetTab === 'github' ? (
            <div className="bg-[#141414] p-2.5 rounded-lg border border-[#222] text-[10px] text-[#AAA] space-y-1.5">
              <div className="flex items-center space-x-1.5 text-white font-medium">
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Workflow: <code>build-apk.yml</code></span>
              </div>
              <p className="text-[10px] text-[#777] leading-relaxed">
                Triggers on <strong>push</strong>, <strong>PR</strong>, or <strong>workflow_dispatch</strong> to build &amp; upload APK artifacts:
              </p>
              <div className="font-mono text-[9px] bg-[#0B0B0B] p-1.5 rounded border border-[#1F1F1F] text-[#CCC] space-y-0.5">
                <div>• ScreenPro-debug.apk</div>
                <div>• ScreenPro-release.apk</div>
              </div>
              <div className="text-[9px] text-[#888]">
                Download APK directly from the GitHub Actions run summary or releases!
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] p-2 rounded-lg border border-[#222] text-[10px] font-mono space-y-1">
              <div className="text-white">./gradlew assembleDebug</div>
              <div className="text-[#666]"># Builds Debug APK</div>
              <div className="text-white mt-1">./gradlew assembleRelease</div>
              <div className="text-[#666]"># Builds Release APK</div>
              <div className="text-white mt-1">./gradlew bundleRelease</div>
              <div className="text-[#666]"># Builds Play Store AAB</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area: Code Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A]">
        <div className="p-3 border-b border-[#1E1E1E] flex items-center justify-between bg-[#111111]/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[#FF4B2B] font-semibold">{selectedFile.path}</span>
              {selectedFile.language === 'yaml' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-400 font-mono">
                  GitHub Actions
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#888]">{selectedFile.description}</div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] text-xs text-white border border-[#2A2A2A] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-[#D4D4D4] bg-[#0A0A0A] leading-relaxed">
          <pre className="overflow-x-auto">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

